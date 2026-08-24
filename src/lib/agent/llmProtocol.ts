import type { AgentAction } from './types';

/** Same-origin endpoint. The Gemini key never crosses this boundary. */
export const AGENT_CHAT_ENDPOINT = '/.netlify/functions/agent-chat';

export type AgentChatRequest = {
  sessionId?: string;
  message: string;
  /** Prior shopper messages for conversational intent only, never factual evidence. */
  context?: string[];
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
