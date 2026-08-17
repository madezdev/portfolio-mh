import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn(async (_options: { html?: string }) => ({})) }));
vi.mock('@server/nodemailer', () => ({ transporter: { sendMail }, mailOptions: { to: 'owner@example.com' } }));
vi.mock('../../server/ai/rate-limit', () => ({ checkContactRateLimit: vi.fn(async () => ({ success: true })) }));

import { POST } from './contact';
import { checkContactRateLimit } from '../../server/ai/rate-limit';

// Mirrors @astrojs/vercel v11, where `clientAddress` is a getter that throws:
// destructuring it in the route signature blows up before the body runs, and
// before any try/catch inside it. Keeping that shape here means reintroducing
// the dependency fails this suite instead of 500-ing production.
function req(body: unknown, ip = '1.2.3.4') {
  return {
    request: new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
    get clientAddress(): string {
      throw new Error('`Astro.clientAddress` is not available in the `@astrojs/vercel` adapter.');
    },
  } as any;
}

const valid = { name: 'Ada', email: 'ada@studio.dev', subject: 'Hola', message: 'Necesito una web', language: 'es' };

describe('POST /api/contact', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects missing required fields with 400 and sends nothing', async () => {
    const res = await POST(req({ email: 'a@b.com' }));
    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rejects an invalid email with 400 and sends nothing', async () => {
    const res = await POST(req({ ...valid, email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rejects an oversized message with 400', async () => {
    const res = await POST(req({ ...valid, message: 'x'.repeat(5001) }));
    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limited and sends nothing', async () => {
    (checkContactRateLimit as any).mockResolvedValueOnce({ success: false });
    const res = await POST(req(valid));
    expect(res.status).toBe(429);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('puts the budget answer in the owner email', async () => {
    // The field was built end-to-end here long before anything sent it. This pins the
    // dormant half now that the AI capture form fills it, so a template edit cannot
    // drop the line without failing.
    const res = await POST(req({ ...valid, budget: 'Sí, ya tengo presupuesto asignado' }));
    expect(res.status).toBe(200);
    const ownerHtml = sendMail.mock.calls[0][0].html as string;
    expect(ownerHtml).toContain('Sí, ya tengo presupuesto asignado');
    expect(ownerHtml).toMatch(/presupuesto/i);
  });

  it('escapes the budget answer and rejects an oversized one', async () => {
    await POST(req({ ...valid, budget: '<img src=y>' }));
    expect(sendMail.mock.calls[0][0].html as string).toContain('&lt;img src=y&gt;');

    sendMail.mockClear();
    const res = await POST(req({ ...valid, budget: 'x'.repeat(101) }));
    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('escapes HTML in the outgoing email body', async () => {
    const res = await POST(req({ ...valid, name: '<script>x</script>', message: 'a & b <img src=y>' }));
    expect(res.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(2);
    const ownerHtml = sendMail.mock.calls[0][0].html as string;
    expect(ownerHtml).not.toContain('<script>x</script>');
    expect(ownerHtml).toContain('&lt;script&gt;');
    expect(ownerHtml).toContain('a &amp; b &lt;img src=y&gt;');
  });
});
