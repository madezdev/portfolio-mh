import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateIntakeTool, createSubmitLeadTool, transcriptOf, hasSubmittedLead } from './tools';
import type { Lead } from '../email/lead';

describe('updateIntake tool', () => {
  it('echoes the recorded state back so it lands in the message history', async () => {
    const out = await updateIntakeTool.execute!(
      { projectType: 'sitio corporativo', isRewrite: false },
      {} as any,
    );
    expect(out).toMatchObject({ projectType: 'sitio corporativo', isRewrite: false });
  });

  it('echoes back a single-field update just as faithfully', async () => {
    const out = await updateIntakeTool.execute!({ isRewrite: true }, {} as any);
    expect(out).toMatchObject({ isRewrite: true });
  });

  it('description instructs the model to correct, not just record — the visitor\'s latest words must win', () => {
    // Pins the single behaviour this feature exists to restore: a visitor's
    // correction must not be silently dropped (the production incident this
    // tool fixes). Regex on two keywords, not the full sentence, so ordinary
    // rewording of the surrounding prose does not break this test.
    const d = updateIntakeTool.description!.toLowerCase();
    expect(d).toMatch(/(?=.*correct)(?=.*contradict)/);
  });
});

const { sendLeadEmails } = vi.hoisted(() => ({ sendLeadEmails: vi.fn(async (_lead: Lead) => {}) }));
vi.mock('../email/lead', () => ({ sendLeadEmails }));
vi.mock('./rate-limit', () => ({ checkContactRateLimit: vi.fn(async () => ({ success: true })) }));
import { checkContactRateLimit } from './rate-limit';

const convo = [
  { id: '1', role: 'user', parts: [{ type: 'text', text: 'quiero una web' }] },
  { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
] as any[];

const lead = {
  name: 'Ada', email: 'ada@x.com', budget: 'assigned',
  summary: 'Sitio corporativo nuevo para una pyme, sin diseño previo.', language: 'es',
} as const;

describe('submitLead tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds the transcript from the real history, not from model-supplied text', async () => {
    const t = createSubmitLeadTool({ messages: convo, ip: '1.2.3.4' });
    await t.execute!({ ...lead }, {} as any);
    const sent = sendLeadEmails.mock.calls[0][0];
    expect(sent.message).toContain('quiero una web');
    expect(sent.message).toContain('contame mas');
    expect(sent.message).toContain(lead.summary);
  });

  it('mails the budget as a sentence, never the state id', async () => {
    const t = createSubmitLeadTool({ messages: convo, ip: '1.2.3.4' });
    await t.execute!({ ...lead }, {} as any);
    expect(sendLeadEmails.mock.calls[0][0].budget).toMatch(/presupuesto asignado/i);
  });

  it('refuses a second submit when the history already carries one', async () => {
    const already = [...convo, {
      id: '3', role: 'assistant',
      parts: [{ type: 'tool-submitLead', state: 'output-available', output: { sent: true } }],
    }] as any[];
    const t = createSubmitLeadTool({ messages: already, ip: '1.2.3.4' });
    const out = await t.execute!({ ...lead }, {} as any);
    expect(out).toMatchObject({ sent: false });
    expect(sendLeadEmails).not.toHaveBeenCalled();
  });

  it('uses the contact limiter, not the chat one, and sends nothing when throttled', async () => {
    (checkContactRateLimit as any).mockResolvedValueOnce({ success: false });
    const t = createSubmitLeadTool({ messages: convo, ip: '1.2.3.4' });
    const out = await t.execute!({ ...lead }, {} as any);
    expect(checkContactRateLimit).toHaveBeenCalledWith('1.2.3.4');
    expect(out).toMatchObject({ sent: false });
    expect(sendLeadEmails).not.toHaveBeenCalled();
  });

  it('validates against leadSchema and sends nothing when the input is malformed', async () => {
    const t = createSubmitLeadTool({ messages: convo, ip: '1.2.3.4' });
    const out = await t.execute!({ ...lead, email: 'not-an-email' } as any, {} as any);
    expect(out).toMatchObject({ sent: false });
    expect(sendLeadEmails).not.toHaveBeenCalled();
  });
});

describe('hasSubmittedLead', () => {
  it('is false for an ordinary conversation', () => {
    expect(hasSubmittedLead(convo)).toBe(false);
  });
});
