import { describe, it, expect } from 'vitest';
import { escapeHtml, isValidEmail } from './security';

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
