import { tool } from 'ai';
import { intakeStateSchema } from './intake-schema';

/**
 * Records what the assistant understood. It has no side effect on purpose: its
 * whole value is that the result lands in the message history, so the next turn
 * sees the assistant's own typed commitments instead of re-reading prose.
 */
export const updateIntakeTool = tool({
  description:
    'Record or CORRECT what you understood about the project. Call this every time the visitor tells you something new, and again the moment their words contradict what you recorded before — the visitor\'s latest words always win.',
  inputSchema: intakeStateSchema,
  execute: async (state) => state,
});
