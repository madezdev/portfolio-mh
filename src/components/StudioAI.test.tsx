import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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
  });

  it('renders the invitation and the AI disclosure in the #ai section', () => {
    render(<StudioAI lang="es" />);
    expect(document.getElementById('ai')).not.toBeNull();
    expect(screen.getByText(/definamos tu proyecto|let's define your project/i)).toBeInTheDocument();
    expect(screen.getByText(/procesada por ia|processed by ai/i)).toBeInTheDocument();
  });

  it('shows a fallback CTA to the contact form when the chat errors', () => {
    mockState = { messages: [], status: 'error', error: new Error('ai_unavailable') };
    render(<StudioAI lang="es" />);
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
    render(<StudioAI lang="es" />);

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
    const { unmount } = render(<StudioAI lang="es" />);
    expect(screen.getByText(/muchas consultas|a lot of requests/i)).toBeInTheDocument();
    unmount();

    mockState = { messages: [], status: 'error', error: new Error('ai_unavailable') };
    render(<StudioAI lang="es" />);
    expect(screen.getByText(/no está disponible|unavailable/i)).toBeInTheDocument();
  });

  it('retries the last turn instead of making the visitor retype it', () => {
    mockState = {
      status: 'error',
      error: new Error('ai_busy'),
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'quiero un saas' }] }],
    };
    render(<StudioAI lang="es" />);

    fireEvent.click(screen.getByRole('button', { name: /reintentar|try again/i }));
    // Clearing first matters: the hook refuses to run while it holds an error.
    expect(clearError).toHaveBeenCalled();
    expect(regenerate).toHaveBeenCalled();
  });

  it('clears a held error before sending a fresh message', () => {
    mockState = { messages: [], status: 'error', error: new Error('ai_unavailable') };
    render(<StudioAI lang="es" />);

    const input = screen.getByPlaceholderText(/escribí tu idea|type your idea/i);
    fireEvent.change(input, { target: { value: 'otra idea' } });
    fireEvent.submit(input.closest('form')!);

    expect(clearError).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith({ text: 'otra idea' });
  });

  it('never hides the composer, however long the conversation runs', () => {
    // Regression test. The composer used to be REPLACED by the capture form at two
    // assistant replies, which amputated the conversation and cut the emailed
    // transcript to four messages.
    mockState = {
      status: 'ready',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
        { id: '3', role: 'user', parts: [{ type: 'text', text: 'un saas' }] },
        { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'dale' }] },
      ],
    };
    render(<StudioAI lang="es" />);
    expect(screen.getByPlaceholderText(/escribí tu idea|type your idea/i)).toBeInTheDocument();
  });

  it('has no capture form: the assistant asks for contact in conversation', () => {
    mockState = {
      status: 'ready',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'contame mas' }] },
        { id: '3', role: 'user', parts: [{ type: 'text', text: 'un saas' }] },
        { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'dale' }] },
      ],
    };
    render(<StudioAI lang="es" />);
    expect(screen.queryByPlaceholderText(/tu nombre|your name/i)).toBeNull();
    expect(screen.queryByLabelText(/presupuesto|budget/i)).toBeNull();
  });

  it('confirms from the submitLead result instead of a boolean flag', () => {
    // The old success branch required showCapture && captured, which is a
    // contradiction — it could never render. Derived state cannot go unreachable.
    mockState = {
      status: 'ready',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'ada@x.com' }] },
        {
          id: '2', role: 'assistant',
          parts: [{ type: 'tool-submitLead', state: 'output-available', output: { sent: true } }],
        },
      ],
    };
    render(<StudioAI lang="es" />);
    expect(screen.getByText(/contactamos pronto|in touch soon/i)).toBeInTheDocument();
  });

  it('does not render an empty bubble for a message that carries only tool parts', () => {
    // `messageText` returns '' for a tool-only message, but the bubble used to
    // render unconditionally — an empty styled span with nothing in it.
    mockState = {
      status: 'ready',
      messages: [
        {
          id: '1', role: 'assistant',
          parts: [{ type: 'tool-updateIntake', state: 'output-available', output: {} }],
        },
      ],
    };
    const { container } = render(<StudioAI lang="es" />);
    expect(container.querySelector('.rounded-2xl.px-4.py-2')).toBeNull();
  });

  it('does not confirm when the lead was not sent', () => {
    mockState = {
      status: 'ready',
      messages: [
        {
          id: '1', role: 'assistant',
          parts: [{ type: 'tool-submitLead', state: 'output-available', output: { sent: false, reason: 'rate_limited' } }],
        },
      ],
    };
    render(<StudioAI lang="es" />);
    expect(screen.queryByText(/contactamos pronto|in touch soon/i)).toBeNull();
  });

  it('shows a typing indicator while the assistant is responding', () => {
    mockState = {
      status: 'submitted',
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hola' }] }],
    };
    render(<StudioAI lang="es" />);
    expect(screen.getByLabelText(/escribiendo|typing/i)).toBeInTheDocument();
  });

  it('renders the invitation title in Spanish', () => {
    render(<StudioAI lang="es" />);
    expect(screen.getByText('Definamos tu proyecto')).toBeInTheDocument();
  });

  it('renders the invitation title in English', () => {
    render(<StudioAI lang="en" />);
    expect(screen.getByText("Let's define your project")).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioAI lang="en" />);
    expect(container.textContent).not.toContain('Definamos tu proyecto');
  });
});
