/**
 * Shopping-assistant contract.
 *
 * The chat UI talks ONLY to `AgentBrain` — it never imports the wizard, never
 * inspects wizard state, and never branches on which brain it received. That
 * is what lets the serverless-backed `llmBrain` and the deterministic fallback
 * sit behind the same interface with zero UI changes.
 *
 * Every method is async even though the stage-1 wizard answers synchronously:
 * the LLM brain awaits a network call, while the UI uses the same pending state
 * for either implementation.
 *
 * A turn returns the FULL transcript rather than a delta. The brain owns
 * conversation state; the UI is a pure renderer of the last turn it received.
 */

export type AgentSender = 'assistant' | 'user';

/** A tappable answer. `id` is opaque to the UI and round-trips to the brain. */
export type AgentChoice = {
  id: string;
  label: string;
};

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
  | { kind: 'restart' };

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
  /** Present while the assistant is waiting on an answer. */
  choices?: AgentChoice[];
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

export type AgentInput =
  | { type: 'choice'; choiceId: string }
  | { type: 'text'; text: string };

export interface AgentBrain {
  /** Stable identifier, for diagnostics only. Never branched on by the UI. */
  readonly id: string;
  /** Opening turn. Safe to call more than once — it resets the conversation. */
  start(): Promise<AgentTurn>;
  send(input: AgentInput): Promise<AgentTurn>;
  /** Steps back one question. No-op turn when there is nothing to go back to. */
  back(): Promise<AgentTurn>;
}
