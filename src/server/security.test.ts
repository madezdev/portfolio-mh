import { describe, it, expect } from 'vitest';
import { escapeHtml, getClientIp, isValidEmail } from './security';

describe('escapeHtml', () => {
  it('neutralizes HTML markup', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(escapeHtml("O'Brien & Co <b>")).toBe('O&#39;Brien &amp; Co &lt;b&gt;');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Hola, quiero una web nueva')).toBe('Hola, quiero una web nueva');
  });
});

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('name.surname@studio.dev')).toBe(true);
  });

  it('rejects malformed addresses and injection payloads', () => {
    for (const bad of ['asdf', 'a@b', 'a @b.com', 'a@b .com', '', 'a@@b.com', 'x@y.com\nBcc: v@e.com']) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
});

describe('getClientIp', () => {
  const withHeaders = (headers: Record<string, string>) =>
    new Request('http://localhost/api/contact', { method: 'POST', headers });

  it('prefers the edge-set headers over the forwarded chain', () => {
    expect(
      getClientIp(withHeaders({ 'x-vercel-forwarded-for': '9.9.9.9', 'x-forwarded-for': '1.1.1.1' })),
    ).toBe('9.9.9.9');
    expect(getClientIp(withHeaders({ 'x-real-ip': '8.8.8.8', 'x-forwarded-for': '1.1.1.1' }))).toBe('8.8.8.8');
  });

  it('takes only the first entry of the forwarded chain', () => {
    expect(getClientIp(withHeaders({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' }))).toBe('1.1.1.1');
  });

  it('falls back to a shared bucket when no header identifies the caller', () => {
    expect(getClientIp(withHeaders({}))).toBe('anonymous');
    expect(getClientIp(withHeaders({ 'x-forwarded-for': '   ' }))).toBe('anonymous');
  });
});
