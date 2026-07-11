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
