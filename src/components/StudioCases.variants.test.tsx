import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Case } from '../data/cases';

// The real case list has no screenshots, live URLs, or stack yet, so the optional
// branches of the card would otherwise go untested until that data lands.
const state = vi.hoisted(() => ({ list: [] as unknown[] }));

vi.mock('../data/cases', () => ({
  get cases() {
    return state.list;
  },
}));

const { default: StudioCases } = await import('./StudioCases');

const base: Case = {
  id: 'acme',
  client: 'Acme',
  title: 'Acme Platform',
  category: 'product',
  tag: 'Fintech · Wallet',
  summary: 'Plataforma de pagos.',
};

function setCases(...list: Case[]) {
  state.list = list;
}

describe('StudioCases — optional case fields', () => {
  beforeEach(() => setCases(base));

  it('renders the screenshot with a descriptive alt and intrinsic size', () => {
    setCases({ ...base, image: '/cases/acme.webp', imageWidth: 1200, imageHeight: 750 });
    render(<StudioCases />);

    const img = screen.getByRole('img', { name: /acme — plataforma de pagos/i });
    expect(img).toHaveAttribute('src', '/cases/acme.webp');
    expect(img).toHaveAttribute('width', '1200');
    expect(img).toHaveAttribute('height', '750');
    expect(img).toHaveAttribute('loading', 'lazy');
    // A centered crop would reduce a UI screenshot to a meaningless middle band.
    expect(img.className).toContain('object-top');
  });

  it('falls back to the branded tile, hidden from assistive tech, when there is no screenshot', () => {
    render(<StudioCases />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(document.querySelector('#cases [aria-hidden="true"] .case-media')).not.toBeNull();
  });

  it('keeps the parallax hook present in both visual branches', () => {
    setCases({ ...base, image: '/cases/acme.webp' }, { ...base, id: 'beta', client: 'Beta' });
    render(<StudioCases />);
    expect(document.querySelectorAll('#cases .case-media')).toHaveLength(2);
  });

  it('renders the tag in the card body, not stacked over the media', () => {
    render(<StudioCases />);
    const tag = screen.getByText('Fintech · Wallet');
    expect(tag.closest('.case-media')).toBeNull();
    expect(document.querySelector('#cases article h3')?.parentElement?.contains(tag)).toBe(true);
  });

  it('renders one chip per stack entry', () => {
    setCases({ ...base, stack: ['React', 'Node', 'Postgres'] });
    render(<StudioCases />);
    const chips = screen.getAllByRole('listitem');
    expect(chips.map((c) => c.textContent)).toEqual(['React', 'Node', 'Postgres']);
  });

  it('makes the whole card clickable and names the link per client', () => {
    setCases({ ...base, liveUrl: 'https://acme.test' });
    render(<StudioCases />);

    const link = screen.getByRole('link', { name: /ver en vivo: acme/i });
    expect(link).toHaveAttribute('href', 'https://acme.test');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // Stretched link — the ::after overlay is what makes the card clickable.
    expect(link.className).toContain('after:inset-0');
  });

  it('gives the hover affordance only to cards that actually link somewhere', () => {
    setCases({ ...base, liveUrl: 'https://acme.test' }, { ...base, id: 'beta', client: 'Beta' });
    render(<StudioCases />);

    const [linked, plain] = Array.from(document.querySelectorAll('#cases article > div'));
    expect(linked.className).toContain('hover:-translate-y-1');
    expect(plain.className).not.toContain('hover:-translate-y-1');
  });

  it('states that a private case is in production instead of linking to its login', () => {
    setCases({ ...base, liveUrl: 'https://acme.test', access: 'private' });
    render(<StudioCases />);

    expect(screen.getByText(/en producción · acceso privado|in production · private access/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ver en vivo|view live/i })).toBeNull();
    expect(document.querySelector('#cases article > div')?.className).not.toContain('hover:-translate-y-1');
  });
});
