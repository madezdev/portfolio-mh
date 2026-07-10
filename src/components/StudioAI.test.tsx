import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const sendMessage = vi.fn();
let mockState: { messages: any[]; status: string } = { messages: [], status: 'ready' };
vi.mock('@ai-sdk/react', () => ({ useChat: () => ({ ...mockState, sendMessage }) }));
vi.mock('ai', () => ({ DefaultChatTransport: class { constructor(_: unknown) {} } }));

import StudioAI from './StudioAI';

describe('StudioAI', () => {
  beforeEach(() => {
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
    mockState = { messages: [], status: 'error' };
    render(<StudioAI />);
    const cta = screen.getByRole('link', { name: /formulario|form/i });
    expect(cta).toHaveAttribute('href', '#contact');
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
});
