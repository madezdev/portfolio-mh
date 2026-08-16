import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  // Accept the standard Upstash names OR the ones the Vercel Upstash
  // Marketplace integration injects (KV_REST_API_*), so it works either way.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  redisClient = url && token
    ? new Redis({
        url,
        token,
        // The client defaults to 5 retries with `Math.exp(n) * 50` backoff — about
        // 11.6s of waiting before it gives up. On a serverless request that is not
        // resilience, it is a hang: an unreachable store would stall every call to
        // an endpoint that is about to allow the request anyway. One quick retry
        // absorbs a blip; anything worse should degrade immediately.
        retry: { retries: 1, backoff: () => 100 },
      })
    : null;
  return redisClient;
}

const limiters = new Map<string, Ratelimit>();

async function limit(
  key: string,
  build: (redis: Redis) => Ratelimit,
  identifier: string,
): Promise<{ success: boolean }> {
  let limiter = limiters.get(key);
  if (!limiter) {
    const redis = getRedis();
    if (!redis) return { success: true }; // dev fallback: no limiting
    limiter = build(redis);
    limiters.set(key, limiter);
  }

  try {
    const { success } = await limiter.limit(identifier);
    return { success };
  } catch (error) {
    // The store is configured but unreachable, which is not the same as absent:
    // credentials go stale, a managed store gets torn down, a region blips. Letting
    // that propagate takes the whole endpoint down — a configured-but-dead store was
    // returning 500 from BOTH /api/chat and /api/contact while the site itself was
    // fine. Throttling is a guard, not the feature, so degrade instead of failing:
    // the per-request size caps still bound what any single call can cost.
    console.error(`Rate limit store unreachable (${key}), allowing request:`, error);
    return { success: true };
  }
}

/** AI chat intake: 10 messages per minute per IP. */
export function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  return limit(
    'chat',
    (redis) => new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '60 s'), prefix: 'madezdev:chat' }),
    identifier,
  );
}

/** Contact / lead email: 5 sends per hour per IP (stricter — it sends mail). */
export function checkContactRateLimit(identifier: string): Promise<{ success: boolean }> {
  return limit(
    'contact',
    (redis) => new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'madezdev:contact' }),
    identifier,
  );
}
