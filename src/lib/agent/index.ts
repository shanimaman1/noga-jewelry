/**
 * The single place a brain is chosen.
 *
 * Stage 1 ships exactly one implementation: the deterministic wizard. When a
 * stage-2 `llmBrain` is approved it is registered here and nowhere else — the
 * chat UI depends only on the `AgentBrain` interface, so adding it must not
 * touch a component.
 *
 * Stage 2 is NOT approved. It needs a serverless function to hold an API key,
 * which would break the project's "client-side only, no backend" constraint.
 * See CLAUDE.md.
 */

import type { AgentBrain } from './types';
import { createWizardBrain } from './wizard';

export type BrainKind = 'wizard';

export function createAgentBrain(kind: BrainKind = 'wizard'): AgentBrain {
  if (kind === 'wizard') return createWizardBrain();
  // Exhaustive today; the guard keeps a future kind from silently returning
  // undefined if it is added to the union but not wired up here.
  throw new Error(`Unknown agent brain: ${kind satisfies never}`);
}

export type {
  AgentAction,
  AgentBrain,
  AgentChoice,
  AgentInput,
  AgentMessage,
  AgentRecommendation,
  AgentSender,
  AgentTurn,
} from './types';
