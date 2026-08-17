# Structured intake: tools instead of a capture form

Status: approved, not implemented
Date: 2026-08-16

## Problem

The AI front door collects a lead through a capture form that appears inside the
chat panel. Two defects were found in production on the same day, one of them from
a real lead email.

### The capture form amputates the conversation and never confirms

`src/components/StudioAI.tsx` renders the form in place of the chat composer:

```tsx
const showCapture = assistantReplies >= 2 && !captured;   // line 24
...
{showCapture ? (
  captured ? ( <p>{t('ai.capture.success')}</p> )         // lines 205-206
```

Reaching the success branch requires `showCapture === true` **and**
`captured === true`, but `showCapture` requires `!captured`. The branch is
unreachable by construction — the success message can never render.

The consequence is worse than a missing label. On a successful submit `captured`
flips to `true`, `showCapture` flips to `false`, and the ternary falls through to
its else branch, which is the chat composer. The visitor submits their details,
receives no confirmation, and gets the text box back as if nothing happened.

That produced the observed lead email: the transcript stops after four messages
because the mail is sent at submit time, and the visitor then kept talking for
three more turns. The budget answer, the AI's summary, and the visitor's own
correction never reached the team. The email template is not at fault — it uses
`white-space: pre-wrap` (`src/pages/api/contact.ts:42`) and the footer was
present, so nothing was clipped in transit.

This predates the budget feature; it comes from the original panel design. No test
caught it because the only test naming the success message asserts its *absence*
in the failure case.

### The conversation does not revise what it believes

Observed transcript, condensed:

| Turn | Message |
|------|---------|
| visitor | `Rehacer mi web` *(suggestion chip)* |
| assistant | asks what kind of site and audience |
| visitor | "Quiero **hacer** una web para una empresa" |
| assistant | "¿Ya tienes un diseño en mente **o** estás comenzando desde cero?" |
| visitor | "no" |
| … | budget, timeline |
| assistant | summary: "estamos hablando de **rehacer** una web…" |
| visitor | "hacer una web desde cero" |

Three distinct defects:

1. **A canned chip became a fact.** `StudioAI.tsx:154` sends the chip label as a
   user message, so the assistant reads `Rehacer mi web` as the visitor's own
   words and never revises it, even when contradicted one turn later. The lead
   email says "rehacer" for a visitor who wants a new site.
2. **Compound either/or questions collect nothing.** A yes/no half joined to an
   open half makes `"no"` an ambiguous answer.
3. **It interrogates rather than converses.** Four questions across four turns,
   with nothing given back. The visitor supplies data and learns nothing.

The shared root cause: **conversation state lives in prose, and the prompt and the
UI disagree about when the conversation ends.** The prompt says "ask 2–4
questions, then summarize and invite contact"; the UI ends the chat at assistant
reply #2.

## Goals

- Capture the lead conversationally, with the same guarantee the required form
  field provided.
- Make conversation state typed and explicit, so a premise cannot be carried
  forward after the visitor contradicts it.
- Remove the entire capture-form bug class rather than repair it.
- Shift the assistant from extractive qualifier to consultant: fewer questions,
  something given back each turn.

## Non-goals

- **Python + LangChain/LangGraph.** Considered and rejected. The two most costly
  defects live in a React component; a server-side state graph fixes neither. The
  state machine here is linear with five slots and one close condition, which the
  AI SDK already expresses natively. Revisit if intake becomes genuinely agentic
  (researching the visitor's company, RAG over past cases, systematic evals).
- **A separate structured-extraction pass per turn.** Doubles AI Gateway calls,
  and the free-tier quota was measured at roughly one four-turn conversation.
  Tool calls travel in the same request and cost nothing extra.
- **Changing `StudioContact`.** It remains the page-level rescue for a visitor
  who never leaves contact details in the chat.
- Conversation persistence, multi-agent orchestration, durable workflows.

## Decisions

### State lives in tool results, not in prose

The assistant calls `updateIntake` whenever it learns *or corrects* something.
Tool calls and results travel inside the message history, so state accumulates
across turns with no external store and no round-trip through the client.

The gain over plain prose is that the model must *write* its conclusions as typed
values. Correcting `isRewrite` from `true` to `false` is an explicit act, which is
much harder to skip than silently reconciling two sentences.

### `isRewrite` is its own field

It is the field that was wrong in production. Making it a boolean rather than
prose inside `projectType` means the contradiction has somewhere to be recorded.

### `submitLead`'s required fields replace the form's `required`

The form guaranteed a budget answer through an HTML constraint. That guarantee now
comes from the schema: `budget` is required on `submitLead`, and Zod rejects the
call without it. The mechanism changes; the guarantee does not.

This is consistent with the earlier decision to add the required select rather
than trust the prompt. That argument was conditional on there being no structured
extraction anywhere — `streamText` returned prose only. Adding tools changes the
condition: a schema is a contract, not a suggestion.

### Email validity comes from the schema, not the browser

`z.string().email()` rejects a malformed address, the error returns to the model,
and it must ask again. This does not verify deliverability — neither did
`type="email"`, so it is not a regression.

### The chat route gains a side effect, guarded three ways

`submitLead` sends mail from `/api/chat`, which until now was free of side
effects. Three guards:

1. `checkContactRateLimit` (5/hour), not the chat limiter (10/minute).
2. Idempotency: if a `submitLead` result already exists in the incoming history,
   refuse without sending.
3. Zod validates before the mailer is touched.

### Email sending is extracted so both callers share it

`emailTemplates` is a route-private const inside a 273-line `contact.ts` that
also holds validation, sending, and routing. The tool cannot reuse it without
duplicating roughly 130 lines of templates, so it moves to a module both callers
import.

### The capture form is removed, not fixed

Deleting `showCapture` / `captured` / `captureError` removes the conditional
rendering that produced the bug. The composer then renders unconditionally, and
there is no state combination that can hide it.

Confirmation becomes derived state: the panel detects a successful `submitLead`
result among the message parts and renders the success line from that. A rendering
driven by data cannot become unreachable the way a boolean pair could.

## Architecture

### Files

| File | Change |
|------|--------|
| `src/server/email/lead.ts` | **new** — `emailTemplates`, `escapeHtml`, `sendLeadEmails(lead)`, exported `Lead` type |
| `src/server/ai/intake-schema.ts` | **new** — Zod schemas for both tools |
| `src/server/ai/intake.ts` | prompt rewritten for consultant behaviour and tool discipline |
| `src/pages/api/chat.ts` | registers both tools; `submitLead` executes server-side |
| `src/pages/api/contact.ts` | reduced to HTTP validation and routing; imports `sendLeadEmails` |
| `src/components/StudioAI.tsx` | capture form removed; composer unconditional; confirmation derived from tool result |
| `src/i18n/translations.ts` | form copy (`prompt`, `name`, `email`, `submit`, `budgetLabel`) removed; `success` and `budgetOptions` kept — see below |
| `src/lib/budget.ts` | unchanged — `BUDGET_STATES` now feeds the schema |

`zod` is added as a dependency; the project has none today.

### Tool contracts

```ts
// updateIntake — no side effect; returns the merged state so it lands in history
{
  projectType?: string,   // "sitio corporativo", "SaaS de turnos"
  isRewrite?: boolean,    // rebuild of an existing site vs. build from scratch
  audience?: string,
  stage?: string,
  timeline?: string,
  budget?: BudgetState,   // 'assigned' | 'defining' | 'exploring'
}

// submitLead — sends the email; required fields are the contract
{
  name: string,           // min 2
  email: string,          // z.string().email()
  budget: BudgetState,    // required
  summary: string,        // min 20 — the assistant's synthesis
  language: 'es' | 'en',  // which template to send; the assistant already
                          // tracks the visitor's language to reply in it
}
```

The owner email carries the summary above the transcript, so the team gets both
the synthesis and the raw conversation.

**The transcript is not a tool argument.** The route already receives the full
message history on every request, so it builds the transcript server-side from
those messages rather than trusting the model to repeat them. This also removes
the truncation failure mode entirely: what is sent is the conversation as it
actually stands at the moment of the call, not a copy the model reconstructed.

**Budget reaches the email as a sentence, not a slug.** The tool carries the
canonical `BudgetState`, but the owner email currently reads
"Presupuesto: Sí, ya tengo presupuesto asignado". `sendLeadEmails` resolves the
state to its localized label using `language`, so that line is unchanged for the
reader. This is why the `ai.capture.budgetOptions` translation keys survive — they
stop being form copy and become the label source for the email.

### Close condition

`submitLead` is refused unless budget, name, and email are present. The prompt
also forbids calling it earlier, but the schema is what enforces it.

### Preserved behaviour

Unchanged from the shipped version: the assistant never quotes, estimates, or
commits to a price; it asks about budget once more in a lighter way if dodged and
then moves on without blocking; it replies in the visitor's language.

## Testing

- **Schema**: malformed email rejected; `submitLead` without `budget` rejected;
  every `updateIntake` field optional.
- **Idempotency**: a second `submitLead` with a prior result in history is refused
  and sends no mail.
- **Rate limiting**: `submitLead` consumes the contact limiter, not the chat one.
- **Prompt**: tool-discipline rules present; the preserved rules (no quoting,
  visitor's language, single budget re-ask) still asserted.
- **`StudioAI`**: the composer is present regardless of assistant reply count
  — a direct regression test for this bug; the confirmation renders from a
  `submitLead` result; no form and no budget select exist in the panel.
- **Budget label**: a `submitLead` carrying `budget: 'assigned'` produces an email
  containing the sentence, not the slug, in both languages.
- **Transcript**: the mail built by `submitLead` contains the whole conversation
  held so far, not a model-supplied copy — the direct regression test for the
  truncation this design replaces.
- **`contact.ts`**: its existing tests must stay green **without modification**
  after the email extraction. They are the safety net for touching a shipped path.

### Live verification

Replay the failing production transcript against the new prompt. The pass
criterion is that when the visitor says "quiero hacer una web" after clicking the
`Rehacer mi web` chip, the assistant calls `updateIntake` with
`isRewrite: false` on that turn, instead of carrying "rehacer" into the summary.

## Risks

| Risk | Mitigation |
|------|-----------|
| `/api/chat` now sends mail | contact rate limiter, idempotency check, schema validation before the mailer |
| Assistant never calls `submitLead` | `#contacto` remains the page-level rescue, by explicit decision |
| Loss of browser autofill for name/email | accepted trade-off; typing an address on mobile is real friction |
| Extracting email templates touches a working production path | `contact.test.ts` stays unmodified and must pass |
| Prompt still governs tone and pacing, and remains probabilistic | the schema governs the data; only voice depends on the prompt |

## Verification after deploy

1. Full conversation on the preview: confirm the assistant asks fewer, deeper
   questions and gives something back each turn.
2. Replay the failing transcript; confirm `isRewrite` is corrected.
3. Complete a lead through conversation only; confirm the owner email arrives with
   summary, full transcript, and the budget line.
4. Confirm the confirmation line renders in the panel after `submitLead`.
5. Confirm the composer never disappears at any point in the conversation.
