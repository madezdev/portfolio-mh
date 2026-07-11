import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  convertToModelMessages: (m: unknown) => m,
  streamText: vi.fn(() => ({ toUIMessageStreamResponse: () => new Response('stream', { status: 200 }) })),
}));
vi.mock('../../server/ai/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ success: true })) }));

import { POST } from './chat';
import { checkRateLimit } from '../../server/ai/rate-limit';

function req(body: unknown, ip = '1.2.3.4') {
  return {
    request: new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
    clientAddress: ip,
  } as any;
}

describe('POST /api/chat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('streams a 200 response on a valid short conversation', async () => {
    const res = await POST(req({ messages: [{ role: 'user', parts: [{ type: 'text', text: 'hola' }] }] }));
    expect(res.status).toBe(200);
  });

  it('returns 429 when rate limited', async () => {
    (checkRateLimit as any).mockResolvedValueOnce({ success: false });
    const res = await POST(req({ messages: [{ role: 'user', parts: [{ type: 'text', text: 'hola' }] }] }));
    expect(res.status).toBe(429);
  });

  it('returns 400 when the conversation exceeds the turn cap', async () => {
    const many = Array.from({ length: 100 }, () => ({ role: 'user', parts: [{ type: 'text', text: 'x' }] }));
    const res = await POST(req({ messages: many }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when a single message exceeds the per-message char cap', async () => {
    const huge = 'x'.repeat(5000);
    const res = await POST(req({ messages: [{ role: 'user', parts: [{ type: 'text', text: huge }] }] }));
    expect(res.status).toBe(400);
  });
});
