/**
 * Shopping-assistant contract.
 *
 * The chat UI talks only to `AgentBrain` and never owns model or failure state.
 * Every method is asynchronous because normal turns await the serverless LLM
 * endpoint while the UI uses one pending state for the whole interaction.
 *
 * A turn returns the FULL transcript rather than a delta. The brain owns
 * conversation state; the UI is a pure renderer of the last turn it received.
 */

export type AgentSender = 'assistant' | 'user';

/**
 * Something the assistant can do to the real app. The UI owns the Hebrew
 * button copy and the wiring (router, cart store, size-guide modal); the brain
 * only decides which actions belong on a message.
 */
export type AgentAction =
  | { kind: 'view-product'; slug: string; karat?: 18 }
  | { kind: 'add-to-cart'; slug: string; karat?: 14 | 18 }
  | { kind: 'size-guide' }
  | { kind: 'whatsapp'; message: string }
  | { kind: 'catalog' };

/**
 * A recommended piece. Carries only the slug — the UI resolves name, price,
 * photograph and alt text from `products.ts` so nothing can drift out of sync
 * with the catalogue.
 */
export type AgentRecommendation = {
  slug: string;
  /** Present only when a tool-backed 18-karat fact was requested. */
  karat?: 18;
  /** One honest line about why this matched. Facts only, from catalogue data. */
  reason: string;
};

export type AgentMessage = {
  id: string;
  sender: AgentSender;
  text: string;
  recommendations?: AgentRecommendation[];
  actions?: AgentAction[];
};

export type AgentTurn = {
  /** The whole conversation so far, oldest first. */
  messages: AgentMessage[];
  /** Whether a "back one step" affordance should be offered right now. */
  canGoBack: boolean;
  /** Whether the free-text composer should be enabled. */
  acceptsText: boolean;
};

export type AgentProgress = 'checking-site';

export type AgentInput = {
  type: 'text';
  text: string;
  onProgress?: (progress: AgentProgress) => void;
};

export interface AgentBrain {
  /** Stable identifier, for diagnostics only. Never branched on by the UI. */
  readonly id: string;
  /** Opening turn. Safe to call more than once. */
  start(): Promise<AgentTurn>;
  send(input: AgentInput): Promise<AgentTurn>;
  /** Steps back one conversation snapshot. */
  back(): Promise<AgentTurn>;
}
