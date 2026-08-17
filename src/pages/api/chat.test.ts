import { describe, it, expect } from 'vitest';
import { isTransient, buildChatTools, isMessageTooLong } from './chat';
import { SUBMIT_LEAD_TOOL } from '../../lib/ai-tools';
import { MAX_MESSAGE_BYTES, MAX_MESSAGE_CHARS } from '../../server/ai/intake';

/**
 * The client shows "try again in a moment" or "the assistant is down" based on this
 * one answer, so the nesting is the whole point: the SDK retries internally and
 * throws a wrapper whose own name and shape reveal nothing.
 */
describe('isTransient', () => {
  it('finds a rate limit that a RetryError carries on lastError, not cause', () => {
    // The trap: RetryError exposes `lastError` and `errors` — it has NO `cause`.
    // Walking `cause` alone returns false here and mislabels the most common
    // failure on this account's tier as a permanent outage.
    const retryError = Object.assign(new Error('Failed after 3 attempts'), {
      name: 'RetryError',
      lastError: Object.assign(new Error('rate limited'), {
        name: 'GatewayRateLimitError',
        statusCode: 429,
      }),
    });
    expect(isTransient(retryError)).toBe(true);
  });

  it('finds one buried in the errors array too', () => {
    const retryError = Object.assign(new Error('Failed after 3 attempts'), {
      name: 'RetryError',
      errors: [
        Object.assign(new Error('boom'), { name: 'APICallError', statusCode: 500 }),
        Object.assign(new Error('rate limited'), { statusCode: 429 }),
      ],
    });
    expect(isTransient(retryError)).toBe(true);
  });

  it('still follows a plain cause chain', () => {
    const wrapped = Object.assign(new Error('outer'), {
      cause: Object.assign(new Error('inner'), { name: 'ServiceUnavailableError' }),
    });
    expect(isTransient(wrapped)).toBe(true);
  });

  it('calls a genuine outage permanent so the copy does not promise a retry', () => {
    const forbidden = Object.assign(new Error('Failed after 3 attempts'), {
      name: 'RetryError',
      lastError: Object.assign(new Error('no access on this tier'), {
        name: 'GatewayInternalServerError',
        statusCode: 403,
      }),
    });
    expect(isTransient(forbidden)).toBe(false);
    expect(isTransient(new Error('something else'))).toBe(false);
    expect(isTransient(undefined)).toBe(false);
  });

  it('terminates on a cyclic error graph', () => {
    // Wrapped provider errors can reference each other; a naive walk hangs the route.
    const a: Record<string, unknown> = { name: 'A' };
    const b: Record<string, unknown> = { name: 'B', cause: a };
    a.cause = b;
    expect(isTransient(a)).toBe(false);
  });
});

/**
 * Pins the tool-name binding: the route registers `submitLead` under the shared
 * `SUBMIT_LEAD_TOOL` constant, the same one `hasSubmittedLead` (server) and
 * `leadSent` (client) read. A hardcoded `'submitLead'` literal here instead of
 * the constant is exactly how a rename previously broke both other consumers
 * while every existing test stayed green.
 */
describe('buildChatTools', () => {
  it('registers submitLead under the shared tool-name constant', () => {
    const tools = buildChatTools({ messages: [], ip: '0.0.0.0' });
    expect(Object.keys(tools)).toContain(SUBMIT_LEAD_TOOL);
    expect(Object.keys(tools)).toEqual(['updateIntake', SUBMIT_LEAD_TOOL]);
  });
});

/**
 * Before this branch `MAX_MESSAGE_CHARS` counted `text` parts only, which was
 * complete coverage. Now the history legitimately carries `tool-updateIntake` /
 * `tool-submitLead` parts whose `input`/`output` are arbitrary JSON that
 * `convertToModelMessages` round-trips into the prompt — and `messages` is
 * client-supplied, so a caller could post a handful of messages carrying huge
 * tool payloads and pay nothing against the cap, at 10 req/min against a paid
 * model.
 */
describe('isMessageTooLong', () => {
  it('bounds the serialized size of tool payloads, not just text', () => {
    const huge = 'x'.repeat(MAX_MESSAGE_BYTES + 1);
    const m = {
      id: '1', role: 'assistant',
      parts: [{ type: 'tool-updateIntake', state: 'output-available', input: { note: huge }, output: {} }],
    } as any;
    expect(isMessageTooLong(m)).toBe(true);
  });

  it('accepts a legitimate closing turn carrying a reply and both tool parts', () => {
    // Regression: the bytes bound used to be MAX_MESSAGE_CHARS, so a real
    // assistant turn — its reply, plus updateIntake (whose input is echoed back
    // as its output, counting twice), plus a submitLead part near its schema
    // maxima — blew the typed-message cap. The visitor's NEXT message then 400'd
    // AFTER their lead had already been mailed, ending a successful session on
    // an error. The two limits exist so a server-generated turn is not measured
    // against what a visitor can type.
    const intake = { projectType: 'x'.repeat(120), audience: 'y'.repeat(120), stage: 'z'.repeat(120), timeline: 'w'.repeat(80), isRewrite: false, budget: 'assigned' };
    const m = {
      id: '1', role: 'assistant',
      parts: [
        { type: 'text', text: 'a'.repeat(1200) },
        { type: 'tool-updateIntake', state: 'output-available', input: intake, output: intake },
        {
          type: 'tool-submitLead', state: 'output-available',
          input: { name: 'n'.repeat(200), email: 'ada@studio.dev', budget: 'assigned', summary: 's'.repeat(1200), language: 'es' },
          output: { sent: true },
        },
      ],
    } as any;
    expect(isMessageTooLong(m)).toBe(false);
  });

  it('still rejects an oversized text part even when the serialized total fits', () => {
    // The text cap is not made redundant by the bytes cap: 2001 chars of typed
    // text serializes well under MAX_MESSAGE_BYTES, so only the text bound catches it.
    const m = { id: '1', role: 'user', parts: [{ type: 'text', text: 'x'.repeat(MAX_MESSAGE_CHARS + 1) }] } as any;
    expect(JSON.stringify(m.parts).length).toBeLessThan(MAX_MESSAGE_BYTES);
    expect(isMessageTooLong(m)).toBe(true);
  });

  it('still bounds a plain oversized text message, unchanged', () => {
    const m = { id: '1', role: 'user', parts: [{ type: 'text', text: 'x'.repeat(MAX_MESSAGE_CHARS + 1) }] } as any;
    expect(isMessageTooLong(m)).toBe(true);
  });

  it('accepts an ordinary message under the cap', () => {
    const m = { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] } as any;
    expect(isMessageTooLong(m)).toBe(false);
  });

  it('treats a message with no parts as empty, not too long', () => {
    const m = { id: '1', role: 'user' } as any;
    expect(isMessageTooLong(m)).toBe(false);
  });
});
