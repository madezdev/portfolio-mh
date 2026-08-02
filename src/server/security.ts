/**
 * Small, dependency-free security helpers shared by the public API routes.
 */

/**
 * Escape HTML-significant characters so user-supplied text can be safely
 * interpolated into an HTML email body (prevents markup / link / pixel
 * injection into the messages we send ourselves).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Conservative email check: exactly one "@", no whitespace, a dotted domain,
 * and within the RFC 5321 length limit. Good enough to reject junk and block
 * header-injection payloads before we hand the address to the mailer.
 */
export function isValidEmail(value: string): boolean {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Resolve the caller's IP for rate limiting, from request headers only.
 *
 * Do NOT reach for `Astro.clientAddress` here: `@astrojs/vercel` v11 removed it
 * and turned it into a throwing getter, so merely destructuring it out of the
 * API context throws before the route body runs.
 *
 * Header order is a trust order, not a convenience order. `x-vercel-forwarded-for`
 * and `x-real-ip` are written by Vercel's edge and cannot be forged by the caller.
 * `x-forwarded-for` is a client-to-edge chain and is only trustworthy at its first
 * entry, so it comes last and we never read the appended hops.
 *
 * Falls back to a shared "anonymous" bucket, which throttles unattributable
 * traffic together rather than letting it through unmetered.
 */
export function getClientIp(request: Request): string {
  const trusted =
    request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip');
  if (trusted?.trim()) return trusted.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  const original = forwarded?.split(',')[0]?.trim();
  return original || 'anonymous';
}
