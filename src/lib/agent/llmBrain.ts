import { getProduct } from '@/data/products';
import type { AgentBrain, AgentInput, AgentMessage, AgentTurn } from './types';
import {
  AGENT_CHAT_ENDPOINT,
  type AgentChatContextMessage,
  type AgentChatRequest,
  type AgentChatResponse,
  type AgentChatStreamEvent,
} from './llmProtocol';
import type { AgentProgress } from './types';

const OPENING = 'אפשר לכתוב לי מה מחפשים, ואני אבדוק מול הקטלוג.';
const GENTLE_ERROR = 'לא הצלחתי לענות כרגע. אפשר לנסות שוב בעוד רגע.';

let messageCounter = 0;
const nextId = () => `llm-agent-${++messageCounter}`;

function lastQuestion(text: string): string | undefined {
  return text.match(/[^.!?\n]*\?/g)?.at(-1)?.trim();
}

const assistant = (text: string, extra: Partial<AgentMessage> = {}): AgentMessage => ({
  id: nextId(),
  sender: 'assistant',
  text,
  ...extra,
});

const user = (text: string): AgentMessage => ({ id: nextId(), sender: 'user', text });

export class PermanentLlmFailure extends Error {
  constructor(readonly messages: AgentMessage[]) {
    super('The LLM path is unavailable for this session.');
  }
}
type Snapshot = AgentMessage[];

function isAgentChatResponse(value: unknown): value is AgentChatResponse {
  if (!value || typeof value !== 'object' || !('mode' in value)) return false;
  const mode = (value as { mode?: unknown }).mode;
  return mode === 'ok' || mode === 'retryable-error' || mode === 'fallback';
}

function isStreamEvent(value: unknown): value is AgentChatStreamEvent {
  if (!value || typeof value !== 'object' || !('type' in value)) return false;
  const event = value as { type?: unknown; status?: unknown; response?: unknown };
  return (
    (event.type === 'status' && event.status === 'checking-site') ||
    (event.type === 'result' && isAgentChatResponse(event.response))
  );
}

async function readStreamResponse(
  response: Response,
  onProgress?: (progress: AgentProgress) => void,
): Promise<AgentChatResponse> {
  if (!response.body) throw new Error('Assistant stream has no body.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: AgentChatResponse | undefined;

  const readLine = (line: string) => {
    if (!line.trim()) return;
    const event: unknown = JSON.parse(line);
    if (!isStreamEvent(event)) throw new Error('Assistant stream event is invalid.');
    if (event.type === 'status') onProgress?.(event.status);
    else result = event.response;
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(readLine);
    if (done) break;
  }
  readLine(buffer);
  if (!result) throw new Error('Assistant stream ended without a result.');
  return result;
}

/**
 * Network-backed brain. It owns only transcript state; all product facts stay
 * behind the function and all recommendation cards resolve their slug against
 * the client catalogue one more time before rendering.
 */
export function createLlmBrain(): AgentBrain {
  let history: Snapshot[] = [];
  let sessionId: string | undefined;
  let consecutiveTransportFailures = 0;

  const current = () => history[history.length - 1] ?? [];
  const turn = (): AgentTurn => ({
    messages: current(),
    canGoBack: history.length > 1,
    acceptsText: true,
  });

  const push = (messages: AgentMessage[]) => history.push(messages);

  const reset = (): AgentTurn => {
    sessionId = undefined;
    consecutiveTransportFailures = 0;
    history = [[assistant(OPENING)]];
    return turn();
  };

  const recoverableFailure = (base: AgentMessage[]): AgentTurn => {
    push([...base, assistant(GENTLE_ERROR)]);
    return turn();
  };

  const sendText = async (
    text: string,
    onProgress?: (progress: AgentProgress) => void,
  ): Promise<AgentTurn> => {
    const context = current()
      .flatMap((message): AgentChatContextMessage[] => {
        if (message.sender === 'user') return [{ role: 'user', text: message.text }];
        const question = lastQuestion(message.text);
        return question ? [{ role: 'assistant', text: question }] : [];
      })
      .slice(-4);
    const base = [...current(), user(text)];
    const requestBody: AgentChatRequest = {
      sessionId,
      message: text,
      ...(context.length > 0 ? { context } : {}),
    };

    let response: Response;
    try {
      response = await fetch(AGENT_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    } catch {
      consecutiveTransportFailures += 1;
      if (consecutiveTransportFailures >= 2) throw new PermanentLlmFailure(base);
      return recoverableFailure(base);
    }

    if (response.status === 404 || response.status === 401 || response.status === 403) {
      throw new PermanentLlmFailure(base);
    }

    let payload: unknown;
    try {
      payload = response.headers.get('content-type')?.includes('application/x-ndjson')
        ? await readStreamResponse(response, onProgress)
        : await response.json();
    } catch {
      consecutiveTransportFailures += 1;
      if (consecutiveTransportFailures >= 2 || response.status < 500) {
        throw new PermanentLlmFailure(base);
      }
      return recoverableFailure(base);
    }

    if (!isAgentChatResponse(payload)) throw new PermanentLlmFailure(base);
    if (payload.mode === 'fallback') throw new PermanentLlmFailure(base);

    if (payload.mode === 'retryable-error') {
      if (payload.sessionId) sessionId = payload.sessionId;
      consecutiveTransportFailures = 0;
      return recoverableFailure(base);
    }

    consecutiveTransportFailures = 0;
    sessionId = payload.sessionId;

    const eighteenKSlugs = new Set(payload.eighteenKSlugs ?? []);
    const recommendations = payload.recommendationSlugs.flatMap((slug) => {
      const product = getProduct(slug);
      return product
        ? [{
            slug: product.slug,
            reason: product.shortDescription,
            ...(eighteenKSlugs.has(slug) && product.availableIn18K ? { karat: 18 as const } : {}),
          }]
        : [];
    });

    push([
      ...base,
      assistant(payload.text, {
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        actions: payload.actions.length > 0 ? payload.actions : undefined,
      }),
    ]);
    return turn();
  };

  return {
    id: 'llm',

    async start() {
      return reset();
    },

    async send(input: AgentInput) {
      if (history.length === 0) reset();
      if (input.type !== 'text') return turn();
      const text = input.text.trim();
      if (!text) return turn();
      return sendText(text, input.onProgress);
    },

    async back() {
      if (history.length > 1) history.pop();
      return turn();
    },
  };
}
