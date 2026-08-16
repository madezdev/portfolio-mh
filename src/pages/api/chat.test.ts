import { describe, it, expect } from 'vitest';
import { isTransient } from './chat';

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
