# Tool-Driven Conversational Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AI panel's capture form with a conversation whose state lives in typed tool calls, so the lead is captured without a form and a contradicted premise cannot survive to the summary.

**Architecture:** Two AI SDK tools on `/api/chat`. `updateIntake` records what the assistant understood (no side effect); `submitLead` closes the lead (validates with Zod, then sends the owner + confirmation emails server-side). Tool calls and results travel inside the message history, so conversation state accumulates with no external store. The capture form and its `showCapture`/`captured` state are deleted outright.

**Tech Stack:** Astro 7 (`output: 'server'`, Vercel adapter v11), React 19, AI SDK v7 (`ai@^7.0.22`) via Vercel AI Gateway, Zod (new dependency), Vitest + Testing Library, nodemailer, Upstash rate limiting.

**Spec:** `docs/superpowers/specs/2026-08-16-ai-intake-tools-design.md`

## Global Constraints

- Model routing string stays `provider/model` form; do not change `INTAKE_MODEL`.
- `src/pages/api/contact.test.ts` must pass **without modification** throughout. It is the safety net for touching a shipped email path.
- `src/components/StudioContact.tsx` and `src/components/StudioContact.test.tsx` must not be touched.
- Preserved assistant rules, verbatim in intent: never quote/estimate/commit to a price; ask about budget once more in a lighter way if dodged, then move on without blocking; always reply in the visitor's language (Spanish or English).
- Budget states are exactly `'assigned' | 'defining' | 'exploring'` from `src/lib/budget.ts`.
- `/api/chat` guards: `MAX_INPUT_MESSAGES = 24`, `MAX_MESSAGE_CHARS = 2000`, `MAX_OUTPUT_TOKENS = 600`.
- Generated artifacts (code, comments, UI copy, commit messages) are in English; user-facing site copy stays ES/EN per the i18n files.
- Never add AI attribution or `Co-Authored-By` trailers to commits.
- `StudioAI` receives the language as a prop — `StudioAI({ lang }: { lang: Language })` — since the locale-routes work merged in `dcb0335`. Every render in a test is `render(<StudioAI lang="es" />)`; there is no language store to set.

---

### Task 1: Extract email sending into a shared module

Only `contact.ts` can send mail today, and its templates are a route-private const. The `submitLead` tool cannot reuse them without duplicating ~130 lines. This task is a **pure refactor**: no behaviour changes.

**Files:**
- Create: `src/server/email/lead.ts`
- Modify: `src/pages/api/contact.ts` (remove `logoUrl`, `emailUser`, `emailTemplates`, and the send block; import instead)
- Test: `src/pages/api/contact.test.ts` — **must pass unmodified**

**Interfaces:**
- Consumes: `transporter`, `mailOptions` from `@server/nodemailer`; `escapeHtml` from `@server/security`
- Produces: `sendLeadEmails(lead: Lead): Promise<void>` and `interface Lead { name; email; subject; budget?: string; message: string; language: 'es' | 'en' }`

- [ ] **Step 1: Run the existing contact tests and record the baseline**

```bash
npm test -- --run src/pages/api/contact.test.ts
```

Expected: PASS. These same tests must still pass at the end of this task without edits.

- [ ] **Step 2: Create the email module**

Move three things out of `src/pages/api/contact.ts` **verbatim** — do not retype or reformat the HTML:

- line 5: `const emailUser = import.meta.env.PUBLIC_EMAIL_USER`
- line 7: `const logoUrl = '...'`
- lines 19–204: the entire `const emailTemplates = { ... };` object

Then add the sending function below them.

```ts
// src/server/email/lead.ts
import { transporter, mailOptions } from '@server/nodemailer';
import { escapeHtml } from '@server/security';

/** A lead ready to be mailed. `budget` is already a human sentence, not a state id. */
export interface Lead {
  name: string;
  email: string;
  subject: string;
  budget?: string;
  message: string;
  language: 'es' | 'en';
}

const emailUser = import.meta.env.PUBLIC_EMAIL_USER;
const logoUrl = 'https://raw.githubusercontent.com/madezdev/portfolio-assets/main/logoMadezdev.png';

// ... emailTemplates moved here verbatim from contact.ts ...

/**
 * Sends both mails for one lead: the notification to the studio and the
 * confirmation to the visitor. Escaping happens here because this is where the
 * HTML lives — callers pass raw values.
 */
export async function sendLeadEmails(lead: Lead): Promise<void> {
  const templates = emailTemplates[lead.language || 'es'];
  const safe: Lead = {
    ...lead,
    name: escapeHtml(lead.name),
    email: escapeHtml(lead.email),
    subject: escapeHtml(lead.subject),
    message: escapeHtml(lead.message),
    budget: lead.budget ? escapeHtml(lead.budget) : undefined,
  };

  await Promise.all([
    transporter.sendMail({
      ...mailOptions,
      from: emailUser,
      to: 'madezdev@gmail.com',
      subject: templates.toOwner.subject(safe.subject),
      html: templates.toOwner.html(safe),
      replyTo: lead.email,
    }),
    transporter.sendMail({
      ...mailOptions,
      from: emailUser,
      to: lead.email,
      subject: templates.toSender.subject,
      html: templates.toSender.html(safe.name),
    }),
  ]);
}
```

- [ ] **Step 3: Reduce the route to validation and routing**

In `src/pages/api/contact.ts`, delete the moved code and replace the escaping + send block with a single call. Keep every validation branch and its status code exactly as they are.

```ts
import { sendLeadEmails, type Lead } from '@server/email/lead';

// inside POST, replacing the `safe` construction and both sendMail blocks:
await sendLeadEmails({
  name: formData.name,
  email: formData.email,
  subject,
  budget: formData.budget,
  message: formData.message,
  language: formData.language,
});

return json({ success: true, message: 'Emails sent successfully' }, 200);
```

Note: `ContactFormData` and `Lead` now describe the same shape. Delete `ContactFormData` and use `Lead` for the parsed body.

- [ ] **Step 4: Verify the refactor changed nothing**

```bash
npm test -- --run src/pages/api/contact.test.ts && npx tsc --noEmit -p tsconfig.json
```

Expected: PASS, unmodified. If a test needed editing, the refactor changed behaviour — revert and redo.

- [ ] **Step 5: Commit**

```bash
git add src/server/email/lead.ts src/pages/api/contact.ts
git commit -m "refactor(email): extract lead mail sending into a shared module"
```

---

### Task 2: Add Zod, the budget label helper, and the intake schemas

**Files:**
- Modify: `package.json` (add `zod`)
- Modify: `src/lib/budget.ts` (add `budgetLabel`)
- Create: `src/server/ai/intake-schema.ts`
- Test: `src/lib/budget.test.ts` (create), `src/server/ai/intake-schema.test.ts` (create)

**Interfaces:**
- Consumes: `BUDGET_STATES`, `BudgetState` from `src/lib/budget.ts`; `translations` from `src/i18n/translations.ts`
- Produces: `budgetLabel(state: BudgetState, lang: 'es' | 'en'): string`; `intakeStateSchema`, `leadSchema`, and types `IntakeState`, `LeadInput` from `src/server/ai/intake-schema.ts`

- [ ] **Step 1: Install Zod**

```bash
npm install zod
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/lib/budget.test.ts
import { describe, it, expect } from 'vitest';
import { BUDGET_STATES, budgetLabel } from './budget';

describe('budgetLabel', () => {
  it('resolves every state to a sentence in both languages', () => {
    for (const state of BUDGET_STATES) {
      expect(budgetLabel(state, 'es')).toMatch(/\s/); // a sentence, not a slug
      expect(budgetLabel(state, 'en')).toMatch(/\s/);
      expect(budgetLabel(state, 'es')).not.toBe(state);
    }
  });

  it('keeps the owner email readable rather than echoing the id', () => {
    expect(budgetLabel('assigned', 'es')).toMatch(/presupuesto asignado/i);
    expect(budgetLabel('exploring', 'en')).toMatch(/exploring/i);
  });
});
```

```ts
// src/server/ai/intake-schema.test.ts
import { describe, it, expect } from 'vitest';
import { intakeStateSchema, leadSchema } from './intake-schema';

describe('intakeStateSchema', () => {
  it('accepts a partial update — the assistant learns one thing at a time', () => {
    expect(intakeStateSchema.safeParse({ isRewrite: false }).success).toBe(true);
    expect(intakeStateSchema.safeParse({}).success).toBe(true);
  });

  it('keeps isRewrite a boolean so a correction is an explicit act', () => {
    expect(intakeStateSchema.safeParse({ isRewrite: 'no' }).success).toBe(false);
  });
});

describe('leadSchema', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@studio.dev',
    budget: 'assigned',
    summary: 'Sitio corporativo nuevo para una pyme, sin diseño previo.',
    language: 'es',
  };

  it('accepts a complete lead', () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed email — this replaces the browser input validation', () => {
    expect(leadSchema.safeParse({ ...valid, email: 'ada@' }).success).toBe(false);
  });

  it('requires budget — this replaces the form field the design removes', () => {
    const { budget, ...withoutBudget } = valid;
    expect(leadSchema.safeParse(withoutBudget).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, budget: 'maybe' }).success).toBe(false);
  });

  it('rejects an empty summary so the studio always gets a synthesis', () => {
    expect(leadSchema.safeParse({ ...valid, summary: 'ok' }).success).toBe(false);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
npm test -- --run src/lib/budget.test.ts src/server/ai/intake-schema.test.ts
```

Expected: FAIL — `budgetLabel` is not exported, `./intake-schema` does not exist.

- [ ] **Step 4: Implement the label helper**

```ts
// append to src/lib/budget.ts
import { translations, type Language } from '../i18n/translations';

/**
 * The tool carries the canonical state; the owner email is read by a person.
 * Resolving here keeps "Presupuesto: Sí, ya tengo presupuesto asignado" in the
 * mail instead of the bare id.
 */
export function budgetLabel(state: BudgetState, lang: Language): string {
  return translations[lang].ai.capture.budgetOptions[state];
}
```

- [ ] **Step 5: Implement the schemas**

```ts
// src/server/ai/intake-schema.ts
import { z } from 'zod';
import { BUDGET_STATES } from '../../lib/budget';

// BUDGET_STATES is a readonly tuple (`as const`). If the installed Zod rejects a
// readonly tuple here, spread it — `z.enum([...BUDGET_STATES])` — rather than
// dropping the `as const`, which is what keeps `BudgetState` a union of literals.
const budget = z.enum(BUDGET_STATES);

/**
 * What the assistant has understood so far. Everything is optional because it
 * accumulates one turn at a time — and because a turn may CORRECT an earlier
 * value rather than add a new one.
 */
export const intakeStateSchema = z.object({
  projectType: z.string().max(120).optional()
    .describe('What they want built, in their words: "sitio corporativo", "SaaS de turnos"'),
  isRewrite: z.boolean().optional()
    .describe('true = rebuilding a site that already exists. false = building from scratch. Correct this the moment the visitor contradicts it.'),
  audience: z.string().max(120).optional(),
  stage: z.string().max(120).optional(),
  timeline: z.string().max(80).optional(),
  budget: budget.optional(),
});

/** The close. Required fields are the contract that replaces the removed form. */
export const leadSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(200),
  budget,
  summary: z.string().min(20).max(1200)
    .describe('One short paragraph: what they need, for whom, at what stage.'),
  language: z.enum(['es', 'en']),
});

export type IntakeState = z.infer<typeof intakeStateSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npm test -- --run src/lib/budget.test.ts src/server/ai/intake-schema.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/budget.ts src/lib/budget.test.ts src/server/ai/intake-schema.ts src/server/ai/intake-schema.test.ts
git commit -m "feat(ai): add zod schemas for intake state and lead capture"
```

---

### Task 3: Register the `updateIntake` tool

**Files:**
- Create: `src/server/ai/tools.ts`
- Modify: `src/pages/api/chat.ts`
- Test: `src/server/ai/tools.test.ts` (create)

**Interfaces:**
- Consumes: `intakeStateSchema` from `src/server/ai/intake-schema.ts`
- Produces: `updateIntakeTool` (an AI SDK `tool`), exported from `src/server/ai/tools.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/server/ai/tools.test.ts
import { describe, it, expect } from 'vitest';
import { updateIntakeTool } from './tools';

describe('updateIntake tool', () => {
  it('echoes the recorded state back so it lands in the message history', async () => {
    const out = await updateIntakeTool.execute!(
      { projectType: 'sitio corporativo', isRewrite: false },
      {} as any,
    );
    expect(out).toMatchObject({ projectType: 'sitio corporativo', isRewrite: false });
  });

  it('has no side effect — it only records', async () => {
    const out = await updateIntakeTool.execute!({ isRewrite: true }, {} as any);
    expect(out).toMatchObject({ isRewrite: true });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npm test -- --run src/server/ai/tools.test.ts
```

Expected: FAIL — `./tools` does not exist.

- [ ] **Step 3: Implement the tool**

```ts
// src/server/ai/tools.ts
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
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npm test -- --run src/server/ai/tools.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire it into the route**

In `src/pages/api/chat.ts`, add the import and two options to the existing `streamText` call. Leave `toUIMessageStreamResponse({ onError })` exactly as it is — it carries the `ai_busy` / `ai_unavailable` classification.

```ts
import { isStepCount } from 'ai';
import { updateIntakeTool } from '../../server/ai/tools';

const result = streamText({
  model: INTAKE_MODEL,
  instructions: intakeInstructions(),
  messages: await convertToModelMessages(messages),
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  tools: { updateIntake: updateIntakeTool },
  // Without stopWhen the model stops after the tool call and never produces the
  // reply that follows it — the panel would go silent every time it records
  // something. 5 leaves room for a record plus the spoken turn.
  stopWhen: isStepCount(5),
});
```

- [ ] **Step 6: Verify the suite and types**

```bash
npm test && npx tsc --noEmit -p tsconfig.json
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/ai/tools.ts src/server/ai/tools.test.ts src/pages/api/chat.ts
git commit -m "feat(ai): record intake state through a tool call"
```

---

### Task 4: Register the `submitLead` tool

The only task with a side effect. Three guards: the contact rate limiter, an idempotency check against the incoming history, and schema validation before the mailer is touched.

**Files:**
- Modify: `src/server/ai/tools.ts`
- Modify: `src/pages/api/chat.ts`
- Test: `src/server/ai/tools.test.ts`

**Interfaces:**
- Consumes: `leadSchema` (Task 2), `budgetLabel` (Task 2), `sendLeadEmails` (Task 1), `checkContactRateLimit` from `src/server/ai/rate-limit.ts`
- Produces: `transcriptOf(messages): string`, `hasSubmittedLead(messages): boolean`, `createSubmitLeadTool(opts: { messages: UIMessage[]; ip: string }): Tool`

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/server/ai/tools.test.ts
import { vi, beforeEach } from 'vitest';
import { createSubmitLeadTool, transcriptOf, hasSubmittedLead } from './tools';

const { sendLeadEmails } = vi.hoisted(() => ({ sendLeadEmails: vi.fn(async () => {}) }));
vi.mock('../email/lead', () => ({ sendLeadEmails }));
vi.mock('./rate-limit', () => ({ checkContactRateLimit: vi.fn(async () => ({ success: true })) }));
import { checkContactRateLimit } from './rate-limit';

const convo = [
  { id: '1', role: 'user', parts: [{ type: 'text', text: 'quiero una web' }] },
  { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
] as any[];

const lead = {
  name: 'Ada', email: 'ada@x.com', budget: 'assigned',
  summary: 'Sitio corporativo nuevo para una pyme, sin diseño previo.', language: 'es',
} as const;

describe('submitLead tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds the transcript from the real history, not from model-supplied text', async () => {
    const t = createSubmitLeadTool({ messages: convo, ip: '1.2.3.4' });
    await t.execute!({ ...lead }, {} as any);
    const sent = sendLeadEmails.mock.calls[0][0];
    expect(sent.message).toContain('quiero una web');
    expect(sent.message).toContain('contame mas');
    expect(sent.message).toContain(lead.summary);
  });

  it('mails the budget as a sentence, never the state id', async () => {
    const t = createSubmitLeadTool({ messages: convo, ip: '1.2.3.4' });
    await t.execute!({ ...lead }, {} as any);
    expect(sendLeadEmails.mock.calls[0][0].budget).toMatch(/presupuesto asignado/i);
  });

  it('refuses a second submit when the history already carries one', async () => {
    const already = [...convo, {
      id: '3', role: 'assistant',
      parts: [{ type: 'tool-submitLead', state: 'output-available', output: { sent: true } }],
    }] as any[];
    const t = createSubmitLeadTool({ messages: already, ip: '1.2.3.4' });
    const out = await t.execute!({ ...lead }, {} as any);
    expect(out).toMatchObject({ sent: false });
    expect(sendLeadEmails).not.toHaveBeenCalled();
  });

  it('uses the contact limiter, not the chat one, and sends nothing when throttled', async () => {
    (checkContactRateLimit as any).mockResolvedValueOnce({ success: false });
    const t = createSubmitLeadTool({ messages: convo, ip: '1.2.3.4' });
    const out = await t.execute!({ ...lead }, {} as any);
    expect(checkContactRateLimit).toHaveBeenCalledWith('1.2.3.4');
    expect(out).toMatchObject({ sent: false });
    expect(sendLeadEmails).not.toHaveBeenCalled();
  });
});

describe('hasSubmittedLead', () => {
  it('is false for an ordinary conversation', () => {
    expect(hasSubmittedLead(convo)).toBe(false);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
npm test -- --run src/server/ai/tools.test.ts
```

Expected: FAIL — `createSubmitLeadTool` is not exported.

- [ ] **Step 3: Implement the helpers and the tool**

```ts
// append to src/server/ai/tools.ts
import type { UIMessage } from 'ai';
import { leadSchema } from './intake-schema';
import { budgetLabel } from '../../lib/budget';
import { sendLeadEmails } from '../email/lead';
import { checkContactRateLimit } from './rate-limit';

/**
 * The transcript is built here rather than taken as a tool argument. The route
 * already holds the real history, so the studio receives the conversation as it
 * actually stands — a model-supplied copy is how the previous design lost every
 * message after the fourth.
 */
export function transcriptOf(messages: UIMessage[]): string {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const text = m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text ?? '')
        .join('');
      return text ? `${m.role === 'user' ? 'Visitante' : 'IA'}: ${text}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

/** Idempotency guard: a completed submitLead result already in the history. */
export function hasSubmittedLead(messages: UIMessage[]): boolean {
  return messages.some((m) =>
    m.parts?.some(
      (p: any) => p.type === 'tool-submitLead' && p.state === 'output-available' && p.output?.sent,
    ),
  );
}

export function createSubmitLeadTool(opts: { messages: UIMessage[]; ip: string }) {
  return tool({
    description:
      'Send the lead to the studio. Call this ONLY once you have their name, their email, and their budget situation, and after you have summarized the project back to them. Never call it earlier.',
    inputSchema: leadSchema,
    execute: async (input) => {
      if (hasSubmittedLead(opts.messages)) {
        return { sent: false, reason: 'already_sent' as const };
      }
      const { success } = await checkContactRateLimit(opts.ip);
      if (!success) {
        return { sent: false, reason: 'rate_limited' as const };
      }
      await sendLeadEmails({
        name: input.name,
        email: input.email,
        subject: 'Lead desde la IA',
        budget: budgetLabel(input.budget, input.language),
        message: `${input.summary}\n\nConversación de intake:\n\n${transcriptOf(opts.messages)}`,
        language: input.language,
      });
      return { sent: true as const };
    },
  });
}
```

- [ ] **Step 4: Run them to verify they pass**

```bash
npm test -- --run src/server/ai/tools.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire it into the route**

`getClientIp(request)` is already computed for the chat rate limit — reuse that value.

```ts
// src/pages/api/chat.ts
import { createSubmitLeadTool } from '../../server/ai/tools';

const ip = getClientIp(request);
const { success } = await checkRateLimit(ip);
// ... existing 429 branch ...

tools: {
  updateIntake: updateIntakeTool,
  submitLead: createSubmitLeadTool({ messages, ip }),
},
// KEEP the stopWhen added in Task 3. Editing the tools object is the moment it
// is easiest to drop, and without it the model falls silent after a tool call.
stopWhen: isStepCount(5),
```

- [ ] **Step 6: Verify the suite and types**

```bash
npm test && npx tsc --noEmit -p tsconfig.json
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/ai/tools.ts src/server/ai/tools.test.ts src/pages/api/chat.ts
git commit -m "feat(ai): close the lead through a validated tool call"
```

---

### Task 5: Rewrite the prompt for consultant behaviour

**Files:**
- Modify: `src/server/ai/intake.ts`
- Test: `src/server/ai/intake.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `intakeInstructions()` with the same signature

- [ ] **Step 1: Write the failing tests**

```ts
// append inside the existing describe in src/server/ai/intake.test.ts
it('treats the opening message as a hypothesis, not a fact', () => {
  const p = intakeInstructions().toLowerCase();
  // The visitor clicked "Rehacer mi web", said "quiero hacer una web" one turn
  // later, and the summary still said "rehacer". The chip is not their words.
  expect(p).toMatch(/suggestion chip|canned|starter/);
  expect(p).toContain('hypothesis');
});

it('requires recording and correcting state through the tool', () => {
  const p = intakeInstructions();
  expect(p).toContain('updateIntake');
  expect(p.toLowerCase()).toMatch(/latest words|most recent words/);
});

it('forbids closing the lead before the required fields exist', () => {
  const p = intakeInstructions();
  expect(p).toContain('submitLead');
  expect(p.toLowerCase()).toMatch(/only.*(name|email).*budget|budget.*name.*email/s);
});

it('asks one thing per turn with concrete alternatives', () => {
  const p = intakeInstructions().toLowerCase();
  expect(p).toMatch(/one question|a single question/);
  expect(p).toMatch(/yes\/no/);
});

it('gives something back rather than only extracting', () => {
  const p = intakeInstructions().toLowerCase();
  expect(p).toMatch(/observation|give.*back|in return/);
  expect(p).toMatch(/never promise|no commitment|not a commitment/);
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
npm test -- --run src/server/ai/intake.test.ts
```

Expected: FAIL — none of the new strings are present.

- [ ] **Step 3: Rewrite `intakeInstructions()`**

Keep the existing array-joined-by-`\n\n` shape. Keep the madezdev identity paragraph and the language paragraph unchanged. Replace the middle with:

```ts
'Your job: help the visitor define their project, like a consultant would — not like a form. Ask 2–3 short questions about the project, plus their budget situation. Never more.',

// The opening message is often a suggestion chip the visitor tapped, not
// something they typed. Treating it as fact is how a lead for a NEW site was
// summarized as a rebuild.
'The visitor\'s first message may be a canned suggestion chip rather than their own words. Treat it as a HYPOTHESIS to confirm, never as a fact.',

'Call updateIntake every time you learn something, and again the moment the visitor contradicts what you recorded — their latest words always win over anything you assumed earlier. Say the correction out loud so they know you heard it.',

'Ask ONE question per turn. If you offer alternatives, make them concrete and mutually exclusive ("is it rebuilding a site that exists, or starting from scratch?"). Never join a yes/no question to an open one — the answer becomes unusable.',

'Give something back in every reply: name what you understood in their own terms, and add one concrete observation about scope or trade-offs. Observations only — never promise a timeline, a price, or a deliverable.',

'Budget is required intake data. Before you invite them to leave their contact, you MUST ask whether they already have a budget assigned for this project, whether it is still being defined, or whether they are only exploring for now. Ask about that situation only — never ask for an amount.',

'If they dodge the budget question, ask once more in a lighter way. If they still prefer not to say, accept it and move on — never block the conversation over it.',

'Never quote, estimate, or commit to a price, cost, or figure of your own. Asking about THEIR budget situation is required; giving THEM a number is not. If pushed for a quote, say the team will confirm figures on a call.',

'When you understand the project, summarize it back in one or two sentences and ask for their name and email so the team can follow up. Call submitLead ONLY once you have all three: name, email, and budget situation. Never call it before that.',
```

- [ ] **Step 4: Run them to verify they pass**

```bash
npm test -- --run src/server/ai/intake.test.ts
```

Expected: PASS, including the pre-existing assertions for `madezdev`, `price`, and `language`.

- [ ] **Step 5: Commit**

```bash
git add src/server/ai/intake.ts src/server/ai/intake.test.ts
git commit -m "feat(ai): reshape the intake prompt around consulting, not extraction"
```

---

### Task 6: Remove the capture form from the panel

**Files:**
- Modify: `src/components/StudioAI.tsx`
- Modify: `src/i18n/translations.ts`
- Test: `src/components/StudioAI.test.tsx`, `src/i18n/ai-i18n.test.ts`

**Interfaces:**
- Consumes: the `tool-submitLead` message part produced by Task 4
- Produces: nothing other tasks depend on

- [ ] **Step 1: Write the failing tests**

Delete the four capture-form tests — `posts the captured lead to /api/contact once the capture form is shown`, `will not submit a lead without a budget answer`, `offers every budget state in the visitor language`, and `shows the fallback CTA instead of the success message when /api/contact fails` — and add these in their place.

Keep `shows a fallback CTA to the contact form when the chat errors`: that one covers the AI error path, which this change does not touch. The `waitFor` import and the `fetch` stub in `beforeEach` become unused once the form is gone — remove them.

```ts
it('never hides the composer, however long the conversation runs', () => {
  // Regression test. The composer used to be REPLACED by the capture form at two
  // assistant replies, which amputated the conversation and cut the emailed
  // transcript to four messages.
  mockState = {
    status: 'ready',
    messages: [
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
      { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
      { id: '3', role: 'user', parts: [{ type: 'text', text: 'un saas' }] },
      { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'dale' }] },
    ],
  };
  render(<StudioAI lang="es" />);
  expect(screen.getByPlaceholderText(/escribí tu idea|type your idea/i)).toBeInTheDocument();
});

it('has no capture form: the assistant asks for contact in conversation', () => {
  mockState = {
    status: 'ready',
    messages: [
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
      { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
      { id: '3', role: 'user', parts: [{ type: 'text', text: 'un saas' }] },
      { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'dale' }] },
    ],
  };
  render(<StudioAI lang="es" />);
  expect(screen.queryByPlaceholderText(/tu nombre|your name/i)).toBeNull();
  expect(screen.queryByLabelText(/presupuesto|budget/i)).toBeNull();
});

it('confirms from the submitLead result instead of a boolean flag', () => {
  // The old success branch required showCapture && captured, which is a
  // contradiction — it could never render. Derived state cannot go unreachable.
  mockState = {
    status: 'ready',
    messages: [
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'ada@x.com' }] },
      {
        id: '2', role: 'assistant',
        parts: [{ type: 'tool-submitLead', state: 'output-available', output: { sent: true } }],
      },
    ],
  };
  render(<StudioAI lang="es" />);
  expect(screen.getByText(/contactamos pronto|in touch soon/i)).toBeInTheDocument();
});

it('does not confirm when the lead was not sent', () => {
  mockState = {
    status: 'ready',
    messages: [
      {
        id: '1', role: 'assistant',
        parts: [{ type: 'tool-submitLead', state: 'output-available', output: { sent: false, reason: 'rate_limited' } }],
      },
    ],
  };
  render(<StudioAI lang="es" />);
  expect(screen.queryByText(/contactamos pronto|in touch soon/i)).toBeNull();
});
```

```ts
// src/i18n/ai-i18n.test.ts — replace the two budget tests with this
it('keeps the budget labels that the owner email renders', () => {
  // These stopped being form copy in this change; they are now the label source
  // for the "Presupuesto:" line, so deleting them would ship a slug in the mail.
  for (const lang of ['es', 'en'] as const) {
    for (const state of BUDGET_STATES) {
      expect(translations[lang].ai.capture.budgetOptions[state]).toBeTruthy();
      expect(translations[lang].ai.capture.budgetOptions[state].length).toBeLessThanOrEqual(100);
    }
  }
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
npm test -- --run src/components/StudioAI.test.tsx src/i18n/ai-i18n.test.ts
```

Expected: FAIL — the form still renders and the confirmation is not derived.

- [ ] **Step 3: Strip the component**

Delete from `src/components/StudioAI.tsx`: the `captured` and `captureError` state, `assistantReplies`, `showCapture`, `handleCapture`, the `BUDGET_STATES` import, and the entire capture-form JSX branch. Unwrap the ternary so the composer form is rendered unconditionally.

Add the derived confirmation above the composer:

```tsx
// A successful submitLead in the history is the only source of truth for this.
// The previous flag pair (`showCapture && captured`) was a contradiction and the
// success line could never render.
const leadSent = messages.some((m) =>
  m.parts.some(
    (p: any) => p.type === 'tool-submitLead' && p.state === 'output-available' && p.output?.sent,
  ),
);
```

```tsx
{leadSent && (
  <p className="mb-4 text-sm text-ember-400">{t('ai.capture.success')}</p>
)}
```

- [ ] **Step 4: Trim the translations**

In both the `es` and `en` blocks of `src/i18n/translations.ts`, reduce `ai.capture` to only what survives:

```ts
capture: {
  // Kept as the panel's confirmation line, and as the label source for the
  // "Presupuesto:" line in the owner email.
  success: '¡Listo! Te contactamos pronto.',
  budgetOptions: {
    assigned: 'Sí, ya tengo presupuesto asignado',
    defining: 'Está en definición',
    exploring: 'Todavía no, estoy explorando',
  },
},
```

Delete `prompt`, `name`, `email`, `submit`, and `budgetLabel` from both blocks.

- [ ] **Step 5: Run the full suite and types**

```bash
npm test && npx tsc --noEmit -p tsconfig.json
```

Expected: PASS. `StudioContact.test.tsx` and `contact.test.ts` must be green without having been edited.

- [ ] **Step 6: Commit**

```bash
git add src/components/StudioAI.tsx src/components/StudioAI.test.tsx src/i18n/translations.ts src/i18n/ai-i18n.test.ts
git commit -m "feat(ai): remove the capture form in favour of conversational capture"
```

---

## Live verification (after Task 6, before opening the PR)

The AI Gateway free tier sustains roughly one four-turn conversation before returning `ai_busy`, and needs well over two minutes to recover. Budget these runs; do not repeat them casually.

- [ ] **Replay the failing production transcript** against the preview deployment:

  1. `Rehacer mi web`
  2. `Quiero hacer una web para una empresa`
  3. `no`
  4. `lo antes posible`

  **Pass criterion:** on turn 2 the assistant calls `updateIntake` with `isRewrite: false` and says the correction out loud, instead of carrying "rehacer" into the summary.

- [ ] **Complete a lead through conversation only.** Confirm the owner email arrives with the summary above the transcript, the full conversation (not four messages), and `Presupuesto:` as a sentence.

- [ ] **Confirm the composer is present at every point** in that conversation, and that the confirmation line appears after the lead is sent.
