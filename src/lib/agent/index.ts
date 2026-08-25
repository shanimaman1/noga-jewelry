/**
 * The single place a brain is chosen.
 *
 * The default is a resilient brain: Gemini first, with the deterministic
 * wizard held in the same instance as a session-permanent fallback. The chat
 * UI still depends only on `AgentBrain` and does not know which path answered.
 */

import type { AgentBrain } from './types';
import { createResilientBrain } from './resilientBrain';
import { createWizardBrain } from './wizard';

export type BrainKind = 'resilient' | 'wizard';

export function createAgentBrain(kind: BrainKind = 'resilient'): AgentBrain {
  if (kind === 'resilient') return createResilientBrain();
  if (kind === 'wizard') return createWizardBrain();
  // Exhaustive guard: a future kind must be wired deliberately.
  // undefined if it is added to the union but not wired up here.
  throw new Error(`Unknown agent brain: ${kind satisfies never}`);
}

export type {
  AgentAction,
  AgentBrain,
  AgentChoice,
  AgentInput,
  AgentMessage,
  AgentProgress,
  AgentRecommendation,
  AgentSender,
  AgentTurn,
} from './types';
