import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn(async (_options: { html?: string; to?: string; replyTo?: string }) => ({})),
}));
vi.mock('@server/nodemailer', () => ({ transporter: { sendMail }, mailOptions: { to: 'owner@example.com' } }));

import { sendLeadEmails } from './lead';

const validLead = {
  name: 'Ada',
  email: 'ada@studio.dev',
  subject: 'Lead desde la IA',
  message: 'Necesito un sitio',
  language: 'es' as const,
};

describe('sendLeadEmails', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a malformed email before building or sending any header', async () => {
    // Both current callers validate — `isValidEmail` on the contact route,
    // `z.email()` on the AI path — so there is no live hole today. This is now a
    // shared primitive with callers on different validation stacks, and the
    // third caller is the one that will get it wrong; the guard makes the
    // primitive self-defending regardless of what a future caller forgets.
    await expect(sendLeadEmails({ ...validLead, email: 'not-an-email' })).rejects.toThrow();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends both the owner notification and the visitor confirmation for a valid lead', async () => {
    await sendLeadEmails(validLead);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('puts the visitor address on `to` for the confirmation and on `replyTo` for the owner mail', async () => {
    await sendLeadEmails(validLead);
    const [ownerCall, senderCall] = sendMail.mock.calls;
    expect(ownerCall[0].replyTo).toBe(validLead.email);
    expect(senderCall[0].to).toBe(validLead.email);
  });
});
