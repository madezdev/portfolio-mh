import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const sendMessage = vi.fn();
const clearError = vi.fn();
const regenerate = vi.fn();
let mockState: { messages: any[]; status: string; error?: Error } = { messages: [], status: 'ready' };
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({ ...mockState, sendMessage, clearError, regenerate }),
}));
vi.mock('ai', () => ({ DefaultChatTransport: class { constructor(_: unknown) {} } }));

import StudioAI from './StudioAI';

describe('StudioAI', () => {
  beforeEach(() => {
    sendMessage.mockClear();
    clearError.mockClear();
    regenerate.mockClear();
    mockState = { messages: [], status: 'ready' };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) })) as any);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the invitation and the AI disclosure in the #ai section', () => {
    render(<StudioAI />);
    expect(document.getElementById('ai')).not.toBeNull();
    expect(screen.getByText(/definamos tu proyecto|let's define your project/i)).toBeInTheDocument();
    expect(screen.getByText(/procesada por ia|processed by ai/i)).toBeInTheDocument();
  });

  it('shows a fallback CTA to the contact form when the chat errors', () => {
    mockState = { messages: [], status: 'error', error: new Error('ai_unavailable') };
    render(<StudioAI />);
    const cta = screen.getByRole('link', { name: /formulario|form/i });
    expect(cta).toHaveAttribute('href', '#contact');
  });

  it('keeps the conversation and the composer alive through an error', () => {
    // The panel used to be replaced wholesale on the first failure, and nothing ever
    // reset the status — one throttled burst ended the session with the transcript
    // gone. The notice is inline now; everything around it survives.
    mockState = {
      status: 'error',
      error: new Error('ai_busy'),
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'quiero un saas' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
      ],
    };
    render(<StudioAI />);

    expect(screen.getByText('quiero un saas')).toBeInTheDocument();
    expect(screen.getByText('contame mas')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // The composer must stay usable: gating it on `status !== 'ready'` also caught
    // `error`, so the field went dead while still looking normal.
    const input = screen.getByPlaceholderText(/escribí tu idea|type your idea/i);
    expect(input).not.toBeDisabled();
  });

  it('distinguishes a throttled burst from the assistant being down', () => {
    mockState = { messages: [], status: 'error', error: new Error('ai_busy') };
    const { unmount } = render(<StudioAI />);
    expect(screen.getByText(/muchas consultas|a lot of requests/i)).toBeInTheDocument();
    unmount();

    mockState = { messages: [], status: 'error', error: new Error('ai_unavailable') };
    render(<StudioAI />);
    expect(screen.getByText(/no está disponible|unavailable/i)).toBeInTheDocument();
  });

  it('retries the last turn instead of making the visitor retype it', () => {
    mockState = {
      status: 'error',
      error: new Error('ai_busy'),
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'quiero un saas' }] }],
    };
    render(<StudioAI />);

    fireEvent.click(screen.getByRole('button', { name: /reintentar|try again/i }));
    // Clearing first matters: the hook refuses to run while it holds an error.
    expect(clearError).toHaveBeenCalled();
    expect(regenerate).toHaveBeenCalled();
  });

  it('clears a held error before sending a fresh message', () => {
    mockState = { messages: [], status: 'error', error: new Error('ai_unavailable') };
    render(<StudioAI />);

    const input = screen.getByPlaceholderText(/escribí tu idea|type your idea/i);
    fireEvent.change(input, { target: { value: 'otra idea' } });
    fireEvent.submit(input.closest('form')!);

    expect(clearError).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith({ text: 'otra idea' });
  });

  it('posts the captured lead to /api/contact once the capture form is shown', async () => {
    // two assistant replies → capture form appears
    mockState = {
      status: 'ready',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
        { id: '3', role: 'user', parts: [{ type: 'text', text: 'un saas' }] },
        { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'genial, dejame tu contacto' }] },
      ],
    };
    render(<StudioAI />);
    fireEvent.change(screen.getByPlaceholderText(/tu nombre|your name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByPlaceholderText(/@email/i), { target: { value: 'ada@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar a madezdev|send to madezdev/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' })));
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ name: 'Ada', email: 'ada@x.com' });
    expect(body.subject).toBeTruthy();
    expect(body.message).toContain('un saas'); // transcript included
  });

  it('shows the fallback CTA instead of the success message when /api/contact fails', async () => {
    mockState = {
      status: 'ready',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
        { id: '3', role: 'user', parts: [{ type: 'text', text: 'un saas' }] },
        { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'genial, dejame tu contacto' }] },
      ],
    };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ success: false }) })) as any);
    render(<StudioAI />);
    fireEvent.change(screen.getByPlaceholderText(/tu nombre|your name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByPlaceholderText(/@email/i), { target: { value: 'ada@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar a madezdev|send to madezdev/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' })));
    const cta = await screen.findByRole('link', { name: /formulario|form/i });
    expect(cta).toHaveAttribute('href', '#contact');
    expect(screen.queryByText(/contactamos pronto|in touch soon/i)).not.toBeInTheDocument();
  });

  it('shows a typing indicator while the assistant is responding', () => {
    mockState = {
      status: 'submitted',
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] }],
    };
    render(<StudioAI />);
    expect(screen.getByLabelText(/escribiendo|typing/i)).toBeInTheDocument();
  });
});
