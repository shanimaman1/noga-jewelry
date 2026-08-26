import type { AgentBrain, AgentInput, AgentMessage, AgentTurn } from './types';
import { createLlmBrain, PermanentLlmFailure } from './llmBrain';

const UNAVAILABLE_LINE =
  'לא הצלחתי לענות כרגע. אפשר לנסות שוב עוד רגע, או לעבור לקטלוג.';

let unavailableCounter = 0;
const unavailableMessage = (): AgentMessage => ({
  id: `agent-unavailable-${++unavailableCounter}`,
  sender: 'assistant',
  text: UNAVAILABLE_LINE,
  actions: [{ kind: 'catalog' }],
});

/** Keeps recoverable failures on Gemini and closes only after a permanent failure. */
export function createResilientBrain(): AgentBrain {
  const llm = createLlmBrain();
  let unavailableTurn: AgentTurn | null = null;

  const closeConversation = (failure: PermanentLlmFailure): AgentTurn => {
    unavailableTurn = {
      messages: [...failure.messages, unavailableMessage()],
      canGoBack: false,
      acceptsText: false,
    };
    return unavailableTurn;
  };

  const runLlm = async (operation: () => Promise<AgentTurn>): Promise<AgentTurn> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PermanentLlmFailure) return closeConversation(error);
      throw error;
    }
  };

  return {
    id: 'resilient',

    async start() {
      if (unavailableTurn) return unavailableTurn;
      return runLlm(() => llm.start());
    },

    async send(input: AgentInput) {
      if (unavailableTurn) return unavailableTurn;
      return runLlm(() => llm.send(input));
    },

    async back() {
      if (unavailableTurn) return unavailableTurn;
      return runLlm(() => llm.back());
    },
  };
}
