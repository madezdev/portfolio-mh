import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioCases from './StudioCases';
import { cases } from '../data/cases';

// Contract against the REAL case data. Branch coverage for the optional fields
// (liveUrl / stack / testimonial) lives in StudioCases.variants.test.tsx, which
// mocks the data module — the real cases exercise only some of those branches.
describe('StudioCases', () => {
  it('renders the marquee track with the list duplicated for a seamless loop', () => {
    // Half the track is exactly one copy, which is the distance the tween travels.
    // Any other multiple and the loop restarts on a visible jump.
    render(<StudioCases />);
    expect(document.getElementById('cases')).not.toBeNull();
    expect(document.querySelectorAll('#cases .cases-track > div')).toHaveLength(2);
    expect(document.querySelectorAll('#cases article')).toHaveLength(cases.length * 2);
  });

  it('exposes each case exactly once to assistive tech', () => {
    // The duplicate exists only so the loop has no seam. A screen reader must hear
    // five cases, not ten.
    render(<StudioCases />);
    for (const c of cases) expect(screen.getByRole('heading', { name: c.title })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(cases.length);
  });

  it('renders no imagery at all — the strip is typographic', () => {
    // A media-led grid has to fill every tile, and a placeholder tile reads as a
    // broken image rather than as a case. Nothing here may reintroduce one.
    render(<StudioCases />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(document.querySelector('#cases img')).toBeNull();
  });

  it('links out only for cases that are reachable, not merely deployed', () => {
    render(<StudioCases />);
    const reachable = cases.filter((c) => c.liveUrl && c.access !== 'private').length;
    expect(screen.queryAllByRole('link', { name: /ver en vivo|view live/i })).toHaveLength(reachable);
  });

  it('never links a private case, however live it is', () => {
    // A private product resolves to a login form; sending a prospect there spends
    // the entry's only click on a credentials screen.
    render(<StudioCases />);
    for (const c of cases.filter((x) => x.access === 'private')) {
      expect(screen.queryByRole('link', { name: new RegExp(c.client, 'i') })).toBeNull();
    }
  });

  it('keeps the reveal hook off the element the marquee tween owns', () => {
    // GSAP pins `translate/rotate/scale: none` inline on what it animates. The
    // reveal owns the viewport, the marquee owns the track — the moment those are
    // the same element one of the two silently stops running.
    render(<StudioCases />);
    const viewport = document.querySelector('#cases .cases-marquee');
    const track = document.querySelector('#cases .cases-track');
    expect(viewport?.classList.contains('reveal')).toBe(true);
    expect(track?.classList.contains('reveal')).toBe(false);
    expect(viewport?.contains(track!)).toBe(true);
  });
});
