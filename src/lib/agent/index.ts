/**
 * The single place a brain is chosen.
 *
 * The resilient brain owns the Gemini conversation and its terminal
 * unavailable state. The chat UI still depends only on `AgentBrain`.
 */

import type { AgentBrain } from './types';
import { createResilientBrain } from './resilientBrain';

export function createAgentBrain(): AgentBrain {
  return createResilientBrain();
}

export type {
  AgentAction,
  AgentBrain,
  AgentInput,
  AgentMessage,
  AgentProgress,
  AgentRecommendation,
  AgentSender,
  AgentTurn,
} from './types';
