import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudioContact from './StudioContact';

describe('StudioContact', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) })) as any);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders in the #contact section with name, email, subject, message and no budget field', () => {
    render(<StudioContact lang="es" />);
    expect(document.getElementById('contact')).not.toBeNull();
    expect(screen.getByLabelText(/nombre|name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaje|message/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/presupuesto|budget/i)).toBeNull();
  });

  it('posts to /api/contact with name/email/subject/message/language and shows success', async () => {
    render(<StudioContact lang="es" />);
    fireEvent.change(screen.getByLabelText(/nombre|name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ada@x.com' } });
    fireEvent.change(screen.getByLabelText(/mensaje|message/i), { target: { value: 'Hola' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar|send/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' })));
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ name: 'Ada', email: 'ada@x.com', message: 'Hola' });
    expect(body).toHaveProperty('language');
    expect(body).not.toHaveProperty('budget');
    await waitFor(() => expect(screen.getByText(/mensaje enviado|message sent/i)).toBeInTheDocument());
  });

  it('renders the section title in Spanish', () => {
    render(<StudioContact lang="es" />);
    expect(screen.getByText('Contanos tu proyecto')).toBeInTheDocument();
  });

  it('renders the section title in English', () => {
    render(<StudioContact lang="en" />);
    expect(screen.getByText('Tell us about your project')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioContact lang="en" />);
    expect(container.textContent).not.toContain('Contanos tu proyecto');
  });
});
