import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Case } from '../data/cases';

/**
 * The strip decides how many copies it needs by measuring itself, and jsdom
 * reports every box as 0x0 — so a component that measures never grows past the
 * single copy it renders on the server. Give every box a width and one extra
 * copy is enough to cover the viewport.
 */
function giveEveryBoxAWidth() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 100,
    height: 0,
    top: 0,
    left: 0,
    right: 100,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

// The real case list has no live URLs yet, so those branches of the entry would
// otherwise go untested until that data lands.
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
  summary: { es: 'Plataforma de pagos.', en: 'A payments platform.' },
};

function setCases(...list: Case[]) {
  state.list = list;
}

// Once the strip has been measured the track repeats the list so the loop has no
// seam. Role queries skip the duplicates on their own (they are `aria-hidden`),
// but text queries do not — so anything asserted by text has to be scoped to the
// copy that actually counts.
function source() {
  const [copy] = Array.from(document.querySelectorAll<HTMLElement>('#cases .cases-track > div'));
  return within(copy);
}

describe('StudioCases — optional case fields', () => {
  beforeEach(() => setCases(base));
  // The layout stub is a prototype spy: leaving it installed would give every
  // later test a measurable strip.
  afterEach(() => vi.restoreAllMocks());

  it('renders a complete entry from name, tag and summary alone', () => {
    // The minimum case carries no stack, no link, no status. It still has to read
    // as a finished entry rather than as a stub waiting for assets.
    render(<StudioCases lang="es" />);
    expect(screen.getByRole('heading', { name: 'Acme Platform' })).toBeInTheDocument();
    expect(source().getByText('Fintech · Wallet')).toBeInTheDocument();
    expect(source().getByText('Plataforma de pagos.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders the summary in the requested locale', () => {
    render(<StudioCases lang="en" />);
    expect(source().getByText('A payments platform.')).toBeInTheDocument();
    expect(source().queryByText('Plataforma de pagos.')).toBeNull();
  });

  it('joins the stack into a single mono line instead of chips', () => {
    setCases({ ...base, stack: ['React', 'Node', 'Postgres'] });
    render(<StudioCases lang="es" />);
    expect(source().getByText('React · Node · Postgres')).toBeInTheDocument();
  });

  it('names the live link per client and opens it safely', () => {
    setCases({ ...base, liveUrl: 'https://acme.test' });
    render(<StudioCases lang="es" />);

    const link = screen.getByRole('link', { name: /ver en vivo: acme/i });
    expect(link).toHaveAttribute('href', 'https://acme.test');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('keeps the duplicated copy out of the tab order', () => {
    // Without this a keyboard user tabs through every case twice, and the second
    // pass lands on links that assistive tech was told do not exist.
    setCases({ ...base, liveUrl: 'https://acme.test' });
    giveEveryBoxAWidth();
    render(<StudioCases lang="es" />);

    const [source, clone] = Array.from(document.querySelectorAll('#cases .cases-track > div'));
    expect(clone).toHaveAttribute('aria-hidden', 'true');
    expect(source.querySelector('a')).not.toHaveAttribute('tabindex');
    expect(clone.querySelector('a')).toHaveAttribute('tabindex', '-1');
  });

  it('serves each case once, and only duplicates it on the client', () => {
    // The duplicate exists for the marquee loop, not for the reader. Rendering it
    // server-side put every case heading in the served HTML twice: `aria-hidden`
    // keeps it out of the accessibility tree, but a crawler reads it anyway.
    setCases({ ...base, liveUrl: 'https://acme.test' });
    const served = renderToStaticMarkup(<StudioCases lang="es" />);
    expect(served.match(/Acme Platform/g)).toHaveLength(1);
    expect(served.match(/Fintech · Wallet/g)).toHaveLength(1);

    giveEveryBoxAWidth();
    render(<StudioCases lang="es" />);
    expect(
      document.querySelectorAll('#cases .cases-track > div').length,
    ).toBeGreaterThan(1);
  });

  it('states that a private case is in production instead of linking to its login', () => {
    setCases({ ...base, liveUrl: 'https://acme.test', access: 'private' });
    render(<StudioCases lang="es" />);

    expect(
      source().getByText(/en producción · acceso privado|in production · private access/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ver en vivo|view live/i })).toBeNull();
  });

  it('hides the duplicate copy when the user asks for reduced motion', () => {
    // With the tween disabled the strip cannot move, so the duplicate is dead
    // weight the user would otherwise scroll straight into.
    giveEveryBoxAWidth();
    render(<StudioCases lang="es" />);
    const [, clone] = Array.from(document.querySelectorAll('#cases .cases-track > div'));
    expect(clone.className).toContain('motion-reduce:hidden');
    expect(document.querySelector('#cases .cases-marquee')?.className).toContain('motion-reduce:overflow-x-auto');
  });

  it('renders the empty state instead of an empty track', () => {
    setCases();
    render(<StudioCases lang="es" />);
    expect(screen.getByText(/casos en camino|case studies coming soon/i)).toBeInTheDocument();
    expect(document.querySelector('#cases .cases-track')).toBeNull();
  });
});
