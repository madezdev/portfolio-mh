import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter;
  // Accept the standard Upstash names OR the ones the Vercel Upstash
  // Marketplace integration injects (KV_REST_API_*), so it works either way.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
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
