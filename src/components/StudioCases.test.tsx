import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioCases from './StudioCases';
import { cases } from '../data/cases';

// Contract against the REAL case data. Branch coverage for the optional fields
// (liveUrl / stack / testimonial) lives in StudioCases.variants.test.tsx, which
// mocks the data module — the real cases exercise only some of those branches.
describe('StudioCases', () => {
  it('renders the marquee track with one copy of the list per cycle', () => {
    // Each track child is exactly one copy, which is the distance the tween
    // travels. Any other division and the loop restarts on a visible jump.
    // The copies past the first are added on the client, once the strip has been
    // measured — jsdom reports no widths, so here that leaves the served copy.
    render(<StudioCases lang="es" />);
    expect(document.getElementById('cases')).not.toBeNull();
    const copies = document.querySelectorAll('#cases .cases-track > div');
    expect(copies).toHaveLength(1);
    expect(document.querySelectorAll('#cases article')).toHaveLength(cases.length);
  });

  it('exposes each case exactly once to assistive tech', () => {
    // The duplicate exists only so the loop has no seam. A screen reader must hear
    // five cases, not ten.
    render(<StudioCases lang="es" />);
    for (const c of cases) expect(screen.getByRole('heading', { name: c.title })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(cases.length);
  });

  it('renders no imagery at all — the strip is typographic', () => {
    // A media-led grid has to fill every tile, and a placeholder tile reads as a
    // broken image rather than as a case. Nothing here may reintroduce one.
    render(<StudioCases lang="es" />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(document.querySelector('#cases img')).toBeNull();
  });

  it('links out only for cases that are reachable, not merely deployed', () => {
    render(<StudioCases lang="es" />);
    const reachable = cases.filter((c) => c.liveUrl && c.access !== 'private').length;
    expect(screen.queryAllByRole('link', { name: /ver en vivo|view live/i })).toHaveLength(reachable);
  });

  it('never links a private case, however live it is', () => {
    // A private product resolves to a login form; sending a prospect there spends
    // the entry's only click on a credentials screen.
    render(<StudioCases lang="es" />);
    for (const c of cases.filter((x) => x.access === 'private')) {
      expect(screen.queryByRole('link', { name: new RegExp(c.client, 'i') })).toBeNull();
    }
  });

  it('keeps the reveal hook off the element the marquee tween owns', () => {
    // GSAP pins `translate/rotate/scale: none` inline on what it animates. The
    // reveal owns the viewport, the marquee owns the track — the moment those are
    // the same element one of the two silently stops running.
    render(<StudioCases lang="es" />);
    const viewport = document.querySelector('#cases .cases-marquee');
    const track = document.querySelector('#cases .cases-track');
    expect(viewport?.classList.contains('reveal')).toBe(true);
    expect(track?.classList.contains('reveal')).toBe(false);
    expect(viewport?.contains(track!)).toBe(true);
  });

  it('renders the section title in Spanish', () => {
    render(<StudioCases lang="es" />);
    expect(screen.getByText('Del concepto a la realidad')).toBeInTheDocument();
  });

  it('renders the section title in English', () => {
    render(<StudioCases lang="en" />);
    expect(screen.getByText('From concept to reality')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioCases lang="en" />);
    expect(container.textContent).not.toContain('Del concepto a la realidad');
  });

  it('renders each case summary in the requested locale, not the other one', () => {
    // The section title alone is not enough of a guard — it caught nothing when
    // the case DATA (summary) shipped Spanish-only into the English route.
    const { container: es } = render(<StudioCases lang="es" />);
    expect(es.textContent).toContain(cases[0].summary.es);
    expect(es.textContent).not.toContain(cases[0].summary.en);

    const { container: en } = render(<StudioCases lang="en" />);
    expect(en.textContent).toContain(cases[0].summary.en);
    expect(en.textContent).not.toContain(cases[0].summary.es);
  });
});
