import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, checkContactRateLimit } from './rate-limit';

describe('rate limiting', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it('allows chat requests when Upstash is not configured (dev fallback)', async () => {
    const r = await checkRateLimit('1.2.3.4');
    expect(r.success).toBe(true);
  });

  it('allows contact requests when Upstash is not configured (dev fallback)', async () => {
    const r = await checkContactRateLimit('1.2.3.4');
    expect(r.success).toBe(true);
  });
});
