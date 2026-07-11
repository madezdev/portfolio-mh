import type { APIRoute } from 'astro';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES, MAX_MESSAGE_CHARS, MAX_OUTPUT_TOKENS } from '../../server/ai/intake';
import { checkRateLimit } from '../../server/ai/rate-limit';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let messages: UIMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: UIMessage[] });
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400 });
  }
  if (messages.length > MAX_INPUT_MESSAGES) {
    return new Response(JSON.stringify({ error: 'too_long' }), { status: 400 });
  }
  const tooLong = messages.some(
    (m) => (m.parts ?? []).reduce((n, p) => n + ('text' in p && typeof p.text === 'string' ? p.text.length : 0), 0) > MAX_MESSAGE_CHARS,
  );
  if (tooLong) {
    return new Response(JSON.stringify({ error: 'too_long' }), { status: 400 });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  try {
    const result = streamText({
      model: INTAKE_MODEL,
      instructions: intakeInstructions(),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('AI chat stream error:', error);
        return 'ai_unavailable';
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'ai_unavailable' }), { status: 503 });
  }
};
