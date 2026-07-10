# madezdev Redesign — Phase C: AI Front Door — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI front door "Definamos tu idea" — a streaming conversational intake assistant at `#ai` that orients + qualifies the visitor, then hands off a captured lead to the existing email system. v1 scope: converse + qualify + derive (no estimates, no tool-calling).

**Architecture:** A server-only intake config + a streaming Astro API route (`/api/chat`) using **AI SDK 7** `streamText` through the **Vercel AI Gateway** (`provider/model` string, model `anthropic/claude-haiku-4.5`). The client is a React island (`StudioAI`, `client:visible`) using `@ai-sdk/react`'s `useChat`. Guardrails: a scoped system prompt, a server-side turn cap, and Upstash rate limiting (with a permissive dev fallback so local dev works before provisioning). UI-driven lead capture (name+email) reuses the existing `POST /api/contact` (nodemailer) — the AI feeds it, does not replace it. Graceful fallback: if the chat errors, the panel degrades to a "contanos por el form / agendá una llamada" CTA so the visitor never hits a dead end.

**Tech Stack:** Astro 5 SSR, React 19, AI SDK 7 (`ai@7.0.20`, `@ai-sdk/react@4.0.21`), Vercel AI Gateway, `@upstash/ratelimit` + `@upstash/redis`, Tailwind 4, existing nodemailer `/api/contact`.

## Global Constraints

- Artifacts in English; **UI copy Spanish-first (ES) + English** in `src/i18n/translations.ts`.
- Studio "we" voice. Ember/ink tokens, NO blue→purple, NO emoji-as-icons. `client:visible` island.
- **AI SDK 7 — use the VERIFIED current APIs (not memory):**
  - Server: `import { convertToModelMessages, streamText, type UIMessage } from 'ai';` — `streamText({ model: 'anthropic/claude-haiku-4.5', instructions, messages: convertToModelMessages(messages), maxOutputTokens })` → `result.toUIMessageStreamResponse()`.
  - Client: `import { useChat } from '@ai-sdk/react'; import { DefaultChatTransport } from 'ai';` — `useChat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })` → `{ messages, sendMessage, status }`. Send with `sendMessage({ text })`. Render `message.parts` (`part.type === 'text' → part.text`). `status: 'submitted' | 'streaming' | 'ready' | 'error'`. Own the input `useState`.
  - Gateway: bare `provider/model` string as `model`. Env `AI_GATEWAY_API_KEY`. Do NOT add a provider package (`@ai-sdk/anthropic`) or `@ai-sdk/gateway` (transitive).
  - Do NOT use removed/renamed APIs: `system` (use `instructions`), `maxTokens` (use `maxOutputTokens`), `toDataStreamResponse` (use `toUIMessageStreamResponse`), `append`/`handleSubmit`/`input` from useChat (removed), `{ role: 'system' }` inside `messages` (rejected — use `instructions`).
- Guardrails required: scoped intake system prompt (on-rails, no pricing/estimates, replies in the visitor's language); server turn cap; rate limiting.
- Reuse `POST /api/contact` unchanged for lead capture (`{ name, email, subject, message, language }`).
- Server AI modules live under `src/server/ai/` (import via the existing `@server/*` alias).
- Do NOT run `astro build`. Verify with `vitest` (mock the model + fetch — never call the live gateway in tests). Conventional commits, no AI attribution.
- **Provisioning is the owner's action** (documented, not blocking the build): `AI_GATEWAY_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Without them, the route returns a graceful error and the panel shows its fallback.

---

### Task 1: Dependencies + env documentation

**Files:**
- Modify: `package.json` (add deps)
- Create: `.env.example`

**Interfaces:**
- Produces: `ai`, `@ai-sdk/react`, `@upstash/ratelimit`, `@upstash/redis` available; documented env contract.

- [ ] **Step 1: Install**

Run: `npm install ai@^7 @ai-sdk/react@^4 @upstash/ratelimit @upstash/redis`
Expected: resolves; `ai` and `@ai-sdk/react` in `dependencies` (they may already be present from the planning research — that is fine, `npm install` is idempotent).

- [ ] **Step 2: Create `.env.example`**

```bash
# Email (existing — Gmail SMTP for the contact form + AI lead hand-off)
SMTP_USER=
SMTP_PASS=
PUBLIC_EMAIL_USER=

# AI front door — Vercel AI Gateway (get a key at vercel.com AI Gateway; on Vercel prod, OIDC can substitute)
AI_GATEWAY_API_KEY=

# Rate limiting — Upstash Redis (Vercel Marketplace). If absent, the API allows requests (dev fallback).
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 3: Verify + commit**

Run: `npm test` (existing 26 pass — no code changed yet).
```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add AI SDK + Upstash deps and env example for the AI front door"
```

---

### Task 2: Intake config + system prompt

**Files:**
- Create: `src/server/ai/intake.ts`
- Test: `src/server/ai/intake.test.ts`

**Interfaces:**
- Produces:
  - `INTAKE_MODEL = 'anthropic/claude-haiku-4.5'`
  - `MAX_INPUT_MESSAGES = 24` (hard server turn cap — reject longer conversations)
  - `MAX_OUTPUT_TOKENS = 600`
  - `intakeInstructions(): string` — the scoped system prompt (the studio intake assistant).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES } from './intake';

describe('intake config', () => {
  it('uses the gateway model string and a sane turn cap', () => {
    expect(INTAKE_MODEL).toBe('anthropic/claude-haiku-4.5');
    expect(MAX_INPUT_MESSAGES).toBeGreaterThan(0);
  });
  it('scopes the assistant: madezdev intake, no pricing, reply in user language', () => {
    const p = intakeInstructions().toLowerCase();
    expect(p).toContain('madezdev');
    expect(p).toContain('price'); // must instruct NOT to commit prices
    expect(p).toContain('language'); // must instruct to reply in the user's language
  });
});
```

- [ ] **Step 2: Run → RED.** `npx vitest run src/server/ai/intake.test.ts`

- [ ] **Step 3: Implement `src/server/ai/intake.ts`**

```ts
export const INTAKE_MODEL = 'anthropic/claude-haiku-4.5';
export const MAX_INPUT_MESSAGES = 24;
export const MAX_OUTPUT_TOKENS = 600;

export function intakeInstructions(): string {
  return [
    'You are the intake assistant for madezdev, a digital product studio that designs and builds websites, custom products/SaaS, automations, and applied AI — "del concepto a la realidad".',
    'Your job: help the visitor define their project. Ask 2–4 short, smart qualifying questions, one or two at a time: what they need, who it is for, what stage they are at, and their rough timeline.',
    'Stay strictly on topic: madezdev services and the visitor\'s project. If asked something off-topic, briefly decline and steer back to their project.',
    'Do NOT quote, estimate, or commit to any price, cost, or budget number. If pushed on price, say the team will discuss it on a call.',
    'Always reply in the SAME language the visitor writes in (Spanish or English). Keep replies concise, warm, and professional — no long walls of text, no markdown headings.',
    'Once you have enough signal about the project, briefly summarize what you understood in one or two sentences and invite them to leave their name and email (or book a call) so the team can follow up.',
  ].join('\n\n');
}
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/server/ai/intake.ts src/server/ai/intake.test.ts
git commit -m "feat: add AI intake config and scoped system prompt"
```

---

### Task 3: Rate limiter (Upstash + dev fallback)

**Files:**
- Create: `src/server/ai/rate-limit.ts`
- Test: `src/server/ai/rate-limit.test.ts`

**Interfaces:**
- Produces: `async function checkRateLimit(identifier: string): Promise<{ success: boolean }>` — uses Upstash sliding-window (10 req / 60s) when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; otherwise returns `{ success: true }` (permissive dev fallback) so local dev works before provisioning.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });
  it('allows requests when Upstash is not configured (dev fallback)', async () => {
    const r = await checkRateLimit('1.2.3.4');
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run → RED.**

- [ ] **Step 3: Implement `src/server/ai/rate-limit.ts`**

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // dev fallback: no limiting
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'madezdev:chat',
  });
  return limiter;
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const l = getLimiter();
  if (!l) return { success: true };
  const { success } = await l.limit(identifier);
  return { success };
}
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/server/ai/rate-limit.ts src/server/ai/rate-limit.test.ts
git commit -m "feat: add Upstash rate limiter with permissive dev fallback"
```

---

### Task 4: The chat API route

**Files:**
- Create: `src/pages/api/chat.ts`
- Test: `src/pages/api/chat.test.ts`

**Interfaces:**
- Consumes: `intakeInstructions`, `INTAKE_MODEL`, `MAX_INPUT_MESSAGES`, `MAX_OUTPUT_TOKENS` (Task 2); `checkRateLimit` (Task 3); `streamText`, `convertToModelMessages` from `ai`.
- Produces: `export const POST` — an Astro API route that rate-limits, enforces the turn cap, streams the model response, and fails gracefully.

**Testing note:** the test mocks `ai`'s `streamText` and the rate limiter — it NEVER calls the live gateway. It asserts the guardrail branches (429 on rate limit, 400 on over-cap, 200 stream on happy path).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  convertToModelMessages: (m: unknown) => m,
  streamText: vi.fn(() => ({ toUIMessageStreamResponse: () => new Response('stream', { status: 200 }) })),
}));
vi.mock('../../server/ai/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ success: true })) }));

import { POST } from './chat';
import { checkRateLimit } from '../../server/ai/rate-limit';

function req(body: unknown, ip = '1.2.3.4') {
  return {
    request: new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
    clientAddress: ip,
  } as any;
}

describe('POST /api/chat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('streams a 200 response on a valid short conversation', async () => {
    const res = await POST(req({ messages: [{ role: 'user', parts: [{ type: 'text', text: 'hola' }] }] }));
    expect(res.status).toBe(200);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as any).mockResolvedValueOnce({ success: false });
    const res = await POST(req({ messages: [{ role: 'user', parts: [{ type: 'text', text: 'hola' }] }] }));
    expect(res.status).toBe(429);
  });

  it('returns 400 when the conversation exceeds the turn cap', async () => {
    const many = Array.from({ length: 100 }, () => ({ role: 'user', parts: [{ type: 'text', text: 'x' }] }));
    const res = await POST(req({ messages: many }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run → RED.**

- [ ] **Step 3: Implement `src/pages/api/chat.ts`**

```ts
import type { APIRoute } from 'astro';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES, MAX_OUTPUT_TOKENS } from '../../server/ai/intake';
import { checkRateLimit } from '../../server/ai/rate-limit';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let messages: UIMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: UIMessage[] });
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 });
  }
  if (messages.length > MAX_INPUT_MESSAGES) {
    return new Response(JSON.stringify({ error: 'too_long' }), { status: 400 });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  try {
    const result = streamText({
      model: INTAKE_MODEL,
      instructions: intakeInstructions(),
      messages: convertToModelMessages(messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    return result.toUIMessageStreamResponse();
  } catch {
    return new Response(JSON.stringify({ error: 'ai_unavailable' }), { status: 503 });
  }
};
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/pages/api/chat.ts src/pages/api/chat.test.ts
git commit -m "feat: add streaming AI chat route with rate limit and turn cap"
```

---

### Task 5: AI panel i18n

**Files:**
- Modify: `src/i18n/translations.ts` (add `ai` namespace to both languages)
- Test: `src/i18n/ai-i18n.test.ts`

**Interfaces:**
- Produces: `ai` namespace (both langs): `eyebrow, title, subtitle, chips (0,1,2), inputPlaceholder, send, capture.{prompt,name,email,submit,success}, fallback.{text,cta}, disclosure`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('ai panel i18n', () => {
  it('defines the ai namespace in both languages', () => {
    for (const lang of ['es', 'en'] as const) {
      expect(translations[lang].ai.title).toBeTruthy();
      expect(translations[lang].ai.inputPlaceholder).toBeTruthy();
      expect(translations[lang].ai.disclosure).toBeTruthy();
      expect(translations[lang].ai.fallback.cta).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run → RED.**

- [ ] **Step 3: Add `es.ai`**

```ts
ai: {
  eyebrow: '// definí tu idea',
  title: 'Definamos tu proyecto',
  subtitle: 'Contanos qué tenés en mente y nuestra IA te ayuda a darle forma. Después el equipo sigue la conversación.',
  chips: { 0: 'Quiero un SaaS', 1: 'Automatizar un proceso', 2: 'Rehacer mi web' },
  inputPlaceholder: 'Escribí tu idea...',
  send: 'Enviar',
  capture: {
    prompt: '¿Seguimos? Dejanos tu contacto y el equipo te escribe.',
    name: 'Tu nombre',
    email: 'tu@email.com',
    submit: 'Enviar a madezdev',
    success: '¡Listo! Te contactamos pronto.',
  },
  fallback: {
    text: 'La IA no está disponible en este momento.',
    cta: 'Contanos tu proyecto por el formulario',
  },
  disclosure: 'Conversación procesada por IA.',
},
```

- [ ] **Step 4: Add `en.ai`**

```ts
ai: {
  eyebrow: '// define your idea',
  title: "Let's define your project",
  subtitle: 'Tell us what you have in mind and our AI helps you shape it. Then the team picks up the conversation.',
  chips: { 0: 'I want a SaaS', 1: 'Automate a process', 2: 'Rebuild my website' },
  inputPlaceholder: 'Type your idea...',
  send: 'Send',
  capture: {
    prompt: 'Want to continue? Leave your contact and the team will reach out.',
    name: 'Your name',
    email: 'you@email.com',
    submit: 'Send to madezdev',
    success: "Done! We'll be in touch soon.",
  },
  fallback: {
    text: 'The AI is unavailable right now.',
    cta: 'Tell us about your project via the form',
  },
  disclosure: 'Conversation processed by AI.',
},
```

- [ ] **Step 5: Run → GREEN + full suite.** Commit:

```bash
git add src/i18n/translations.ts src/i18n/ai-i18n.test.ts
git commit -m "feat: add AI front-door i18n namespace"
```

---

### Task 6: StudioAI component (chat island + capture + fallback)

**Files:**
- Create: `src/components/StudioAI.tsx`
- Test: `src/components/StudioAI.test.tsx`

**Interfaces:**
- Consumes: `useStore`, `useTranslations`, i18n `ai.*`; `useChat` from `@ai-sdk/react`, `DefaultChatTransport` from `ai`; `Section` + `Container`.
- Produces: default export `StudioAI`, `<section id="ai">`. Renders the invitation (title/subtitle/chips), the streaming chat, a capture form that appears after ≥2 assistant replies (posts the transcript to `POST /api/contact`), a `fallback` CTA to `#contact` when `status === 'error'`, and the `disclosure` line.

**Scope note:** SKIP any visual-QA/design-skill step (deferred to the joint visual pass) — code + test + commit only.

**Testing note:** mock `@ai-sdk/react`'s `useChat` to return controlled `messages`/`status`/`sendMessage`, and stub `fetch` for the capture POST. Do NOT hit the network/model.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const sendMessage = vi.fn();
let mockState: { messages: any[]; status: string } = { messages: [], status: 'ready' };
vi.mock('@ai-sdk/react', () => ({ useChat: () => ({ ...mockState, sendMessage }) }));
vi.mock('ai', () => ({ DefaultChatTransport: class { constructor(_: unknown) {} } }));

import StudioAI from './StudioAI';

describe('StudioAI', () => {
  beforeEach(() => {
    mockState = { messages: [], status: 'ready' };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) })) as any);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the invitation and the AI disclosure in the #ai section', () => {
    render(<StudioAI />);
    expect(document.getElementById('ai')).not.toBeNull();
    expect(screen.getByText(/definamos tu proyecto|let's define your project/i)).toBeInTheDocument();
    expect(screen.getByText(/procesada por ia|processed by ai/i)).toBeInTheDocument();
  });

  it('shows a fallback CTA to the contact form when the chat errors', () => {
    mockState = { messages: [], status: 'error' };
    render(<StudioAI />);
    const cta = screen.getByRole('link', { name: /formulario|form/i });
    expect(cta).toHaveAttribute('href', '#contact');
  });

  it('posts the captured lead to /api/contact once the capture form is shown', async () => {
    // two assistant replies → capture form appears
    mockState = {
      status: 'ready',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
        { id: '3', role: 'user', parts: [{ type: 'text', text: 'un saas' }] },
        { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'genial, dejame tu contacto' }] },
      ],
    };
    render(<StudioAI />);
    fireEvent.change(screen.getByPlaceholderText(/tu nombre|your name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByPlaceholderText(/@email/i), { target: { value: 'ada@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar a madezdev|send to madezdev/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' })));
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ name: 'Ada', email: 'ada@x.com' });
    expect(body.subject).toBeTruthy();
    expect(body.message).toContain('un saas'); // transcript included
  });
});
```

- [ ] **Step 2: Run → RED.**

- [ ] **Step 3: Implement `src/components/StudioAI.tsx`**

```tsx
import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { Section } from './primitives/Section';
import { Container } from './primitives/Container';

function messageText(m: { parts: Array<{ type: string; text?: string }> }): string {
  return m.parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
}

export default function StudioAI() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');
  const [captured, setCaptured] = useState(false);

  const assistantReplies = messages.filter((m) => m.role === 'assistant').length;
  const showCapture = assistantReplies >= 2 && !captured;

  function send(text: string) {
    const value = text.trim();
    if (!value || status !== 'ready') return;
    sendMessage({ text: value });
    setInput('');
  }

  async function handleCapture(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Visitante' : 'IA'}: ${messageText(m)}`)
      .join('\n');
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        subject: 'Lead desde la IA',
        message: `Conversación de intake:\n\n${transcript}`,
        language: lang,
      }),
    });
    setCaptured(true);
  }

  const field = 'w-full rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-fg placeholder-fg-muted/60 focus:border-ember-500 focus:outline-none';

  return (
    <Section id="ai" className="border-t border-ink-800">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-blueprint-300">{t('ai.eyebrow')}</p>
          <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">{t('ai.title')}</h2>
          <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t('ai.subtitle')}</p>

          <div className="mt-10 rounded-2xl border border-ink-800 bg-ink-900/40 p-4 md:p-6">
            {status === 'error' ? (
              <div className="py-8 text-center">
                <p className="text-fg-muted">{t('ai.fallback.text')}</p>
                <a href="#contact" className="mt-4 inline-block font-semibold text-ember-500 hover:text-ember-400">
                  {t('ai.fallback.cta')} →
                </a>
              </div>
            ) : (
              <>
                {messages.length > 0 && (
                  <div className="mb-4 max-h-80 space-y-4 overflow-y-auto">
                    {messages.map((m) => (
                      <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                        <span
                          className={
                            'inline-block max-w-[85%] rounded-2xl px-4 py-2 text-sm ' +
                            (m.role === 'user' ? 'bg-ember-500 text-ink-950' : 'bg-ink-800 text-fg')
                          }
                        >
                          {messageText(m)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {messages.length === 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => send(t(`ai.chips.${i}`))}
                        className="rounded-full border border-ink-700 px-4 py-2 text-sm text-fg-muted transition-colors hover:border-ember-500/50 hover:text-fg"
                      >
                        {t(`ai.chips.${i}`)}
                      </button>
                    ))}
                  </div>
                )}

                {showCapture ? (
                  captured ? (
                    <p className="text-sm text-ember-400">{t('ai.capture.success')}</p>
                  ) : (
                    <form onSubmit={handleCapture} className="space-y-3">
                      <p className="text-sm text-fg-muted">{t('ai.capture.prompt')}</p>
                      <input name="name" required className={field} placeholder={t('ai.capture.name')} />
                      <input name="email" type="email" required autoComplete="email" className={field} placeholder={t('ai.capture.email')} />
                      <button type="submit" className="w-full rounded-full bg-ember-500 px-6 py-3 font-semibold text-ink-950 hover:bg-ember-400">
                        {t('ai.capture.submit')}
                      </button>
                    </form>
                  )
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={status !== 'ready'}
                      className={field}
                      placeholder={t('ai.inputPlaceholder')}
                      aria-label={t('ai.inputPlaceholder')}
                    />
                    <button
                      type="submit"
                      disabled={status !== 'ready'}
                      className="rounded-full bg-ember-500 px-6 py-3 font-semibold text-ink-950 hover:bg-ember-400 disabled:opacity-60"
                    >
                      {t('ai.send')}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">{t('ai.disclosure')}</p>
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 4: Run → GREEN + full suite.** Commit:

```bash
git add src/components/StudioAI.tsx src/components/StudioAI.test.tsx
git commit -m "feat: add StudioAI front-door chat island with capture and fallback"
```

---

### Task 7: Mount StudioAI at `#ai`

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `StudioAI`.
- Produces: the empty `#ai` placeholder replaced by `<StudioAI client:visible />` (which renders `id="ai"`); `#process` stays a placeholder (Phase D). Hero's "Definí tu proyecto" CTA (`href="#ai"`) now lands on the real panel.

- [ ] **Step 1: Add the import** (after the other Studio imports) in `src/pages/index.astro`:

```astro
import StudioAI from '../components/StudioAI.tsx';
```

- [ ] **Step 2: Replace the empty `#ai` placeholder** in `<main>`:

Change `<section id="ai" class="min-h-[40vh]"></section>` to:

```astro
		<StudioAI client:visible />
```

Leave `#process` as-is. No `client:load`.

- [ ] **Step 3: Verify + commit**

Run: `rg "client:load" src/pages/index.astro` → no matches. `npm test` → all green (no test renders index.astro).
```bash
git add src/pages/index.astro
git commit -m "feat: mount the AI front door at #ai"
```

---

## Self-Review

**Spec coverage (Phase C):**
- AI front door "Definamos tu idea" streaming chat → Tasks 4, 6. ✅
- v1 scope converse + qualify + derive, no estimates → Task 2 (system prompt), Task 6 (capture). ✅
- Guardrails: scoped prompt (Task 2), server turn cap (Task 4), rate limit (Task 3). ✅
- Reuse `/api/contact` for lead hand-off (transcript included) → Task 6. ✅
- Graceful fallback + AI disclosure → Task 6. ✅
- SSR-safe island `client:visible`, ember/ink, bilingual → Tasks 5, 6, 7. ✅
- Provisioning documented, non-blocking (dev fallback in Task 3; route returns 503 when the model errors) → Tasks 1, 3, 4.
- Out of scope (correctly): tool-calling capture, brief/estimate generation, Cal.com booking, `#process` (Phase D).

**Placeholder scan:** none — all APIs are the VERIFIED AI SDK 7 surface; model id, env names, and method names are concrete.

**Type/API consistency:** `streamText`/`convertToModelMessages`/`toUIMessageStreamResponse` (Task 4) match the verified `ai@7` API; `useChat`+`DefaultChatTransport` (Task 6) match `@ai-sdk/react@4`/`ai@7`; `instructions` (not `system`), `maxOutputTokens` (not `maxTokens`); intake exports (Task 2) consumed by Task 4; `checkRateLimit` (Task 3) consumed by Task 4; `ai.*` i18n keys (Task 5) consumed by Task 6; `StudioAI` default export (Task 6) mounted in Task 7; capture POST body matches the `/api/contact` contract (`name,email,subject,message,language`).

## Open items carried to build / owner action
- Owner provisions `AI_GATEWAY_API_KEY` + Upstash env in Vercel to make the chat live (until then: 503 + panel fallback; rate limiter is permissive).
- Visual polish of the chat panel (bubbles, streaming affordance, mobile) → joint visual pass.
- v2 (future): tool-calling structured capture; optional brief/estimate; Cal.com booking; localized case data.
