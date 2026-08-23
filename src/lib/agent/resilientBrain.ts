import type { AgentBrain, AgentInput, AgentMessage, AgentTurn } from './types';
import { createLlmBrain, PermanentLlmFailure } from './llmBrain';
import { createWizardBrain } from './wizard';

const FALLBACK_LINE = 'הבדיקה החכמה לא זמינה כרגע, אז נעבור לעזרה הקצרה מהקטלוג.';

let fallbackCounter = 0;
const fallbackMessage = (): AgentMessage => ({
  id: `agent-fallback-${++fallbackCounter}`,
  sender: 'assistant',
  text: FALLBACK_LINE,
});

/** Holds both brains. Once the LLM path fails systemically, this instance never retries it. */
export function createResilientBrain(): AgentBrain {
  const llm = createLlmBrain();
  const wizard = createWizardBrain();
  let active: 'llm' | 'wizard' = 'llm';
  let wizardPrefix: AgentMessage[] = [];

  const withPrefix = (turn: AgentTurn): AgentTurn => ({
    ...turn,
    messages: [...wizardPrefix, ...turn.messages],
  });

  const switchToWizard = async (failure: PermanentLlmFailure): Promise<AgentTurn> => {
    active = 'wizard';
    wizardPrefix = [...failure.messages, fallbackMessage()];
    return withPrefix(await wizard.start());
  };

  const runLlm = async (operation: () => Promise<AgentTurn>): Promise<AgentTurn> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PermanentLlmFailure) return switchToWizard(error);
      throw error;
    }
  };

  return {
    id: 'resilient',

    async start() {
      if (active === 'llm') return runLlm(() => llm.start());
      wizardPrefix = [fallbackMessage()];
      return withPrefix(await wizard.start());
    },

    async send(input: AgentInput) {
      if (active === 'llm') return runLlm(() => llm.send(input));
      return withPrefix(await wizard.send(input));
    },

    async back() {
      if (active === 'llm') return runLlm(() => llm.back());
      return withPrefix(await wizard.back());
    },
  };
}
