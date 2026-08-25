import type { AgentAction } from './types';

/** Same-origin endpoint. The Gemini key never crosses this boundary. */
export const AGENT_CHAT_ENDPOINT = '/.netlify/functions/agent-chat';

export type AgentChatHistoryMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export type AgentChatRequest = {
  sessionId?: string;
  message: string;
  /** Full prior conversation, never factual evidence for the current turn. */
  history?: AgentChatHistoryMessage[];
};

export type LlmClientAction = Extract<AgentAction, { kind: 'size-guide' | 'whatsapp' }>;

export type AgentChatResponse =
  | {
      mode: 'ok';
      sessionId: string;
      text: string;
      recommendationSlugs: string[];
      eighteenKSlugs: string[];
      actions: LlmClientAction[];
    }
  | {
      mode: 'retryable-error';
      sessionId?: string;
    }
  | {
      mode: 'fallback';
    };

export type AgentChatStreamEvent =
  | { type: 'status'; status: 'checking-site' }
  | { type: 'result'; response: AgentChatResponse };
