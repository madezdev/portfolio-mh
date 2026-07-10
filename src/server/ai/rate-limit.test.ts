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
