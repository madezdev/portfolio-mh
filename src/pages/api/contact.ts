import type { APIRoute } from 'astro';
import { getClientIp, isValidEmail } from '@server/security';
import { checkContactRateLimit } from '../../server/ai/rate-limit';
import { sendLeadEmails, type Lead } from '@server/email/lead';

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.json() as Lead;
    const subject = formData.subject ?? '';

    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      return json({ success: false, message: 'Missing required fields' }, 400);
    }
    if (!isValidEmail(formData.email)) {
      return json({ success: false, message: 'Invalid email' }, 400);
    }
    // Reject oversized payloads (abuse / cost control).
    if (formData.name.length > 200 || subject.length > 300 || formData.message.length > 5000 || (formData.budget?.length ?? 0) > 100) {
      return json({ success: false, message: 'Field too long' }, 400);
    }

    // Throttle: this endpoint sends real email, so keep it strict.
    const { success } = await checkContactRateLimit(getClientIp(request));
    if (!success) {
      return json({ success: false, message: 'Too many requests' }, 429);
    }

    await sendLeadEmails({
      name: formData.name,
      email: formData.email,
      subject,
      budget: formData.budget,
      message: formData.message,
      language: formData.language,
    });

    return json({ success: true, message: 'Emails sent successfully' }, 200);
  } catch (error) {
    console.error('Email sending error:', error);
    return json({ success: false, message: 'Failed to send email' }, 500);
  }
};