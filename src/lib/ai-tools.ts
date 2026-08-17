/**
 * The tool-name contract shared between the route that registers the tool, the
 * server-side idempotency guard, and the client-side confirmation renderer.
 *
 * All three used to carry the same literal (`'submitLead'` / `'tool-submitLead'`)
 * independently: `chat.ts` as the `tools` registration key, `hasSubmittedLead` in
 * `tools.ts` as a part-type check, and `leadSent` in `StudioAI.tsx` as the same
 * check on the client. Renaming the registration key in `chat.ts` alone silently
 * broke both consumers — idempotency stopped refusing repeats and the
 * confirmation stopped rendering — while the test suite stayed green, because
 * each test file pinned its own hardcoded copy of the literal rather than a
 * shared source of truth.
 *
 * Lives in `src/lib/` (client-safe) rather than `src/server/` so `StudioAI.tsx`
 * can import it without pulling server-only code into a client bundle.
 */
export const SUBMIT_LEAD_TOOL = 'submitLead';

/**
 * The AI SDK's `UIMessage` part type for a tool call/result is `tool-${name}`,
 * derived from whatever key the tool is registered under. Built as a template
 * literal from `SUBMIT_LEAD_TOOL` so the two can never drift from each other.
 */
export const SUBMIT_LEAD_TOOL_PART = `tool-${SUBMIT_LEAD_TOOL}` as const;
