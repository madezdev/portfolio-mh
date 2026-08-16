import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, checkContactRateLimit } from './rate-limit';

describe('rate limiting', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('allows chat requests when Upstash is not configured (dev fallback)', async () => {
    const r = await checkRateLimit('1.2.3.4');
    expect(r.success).toBe(true);
  });

  it('allows contact requests when Upstash is not configured (dev fallback)', async () => {
    const r = await checkContactRateLimit('1.2.3.4');
    expect(r.success).toBe(true);
  });

  it('degrades instead of throwing when the store is configured but unreachable', async () => {
    // Configured-but-dead is NOT the same as absent, and it is the case that took
    // both /api/chat and /api/contact to 500 in preview: stale credentials made
    // every limiter call reject with `fetch failed`, and the throw escaped the route.
    process.env.UPSTASH_REDIS_REST_URL = 'https://unreachable.invalid';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'stale-token';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')));

    const fresh = await import('./rate-limit?unreachable');
    await expect(fresh.checkRateLimit('1.2.3.4')).resolves.toEqual({ success: true });
    await expect(fresh.checkContactRateLimit('1.2.3.4')).resolves.toEqual({ success: true });

    vi.unstubAllGlobals();
  });
});
