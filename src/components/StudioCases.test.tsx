import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioCases from './StudioCases';
import { cases } from '../data/cases';

// Contract against the REAL case data. Branch coverage for the optional fields
// (image / liveUrl / stack) lives in StudioCases.variants.test.tsx, which mocks
// the data module — none of the real cases exercise those branches yet.
describe('StudioCases', () => {
  it('renders one card per case with its title', () => {
    render(<StudioCases />);
    expect(document.getElementById('cases')).not.toBeNull();
    const articles = document.querySelectorAll('#cases article');
    expect(articles.length).toBe(cases.length);
    for (const c of cases) expect(screen.getByRole('heading', { name: c.title })).toBeInTheDocument();
  });

  it('renders an <img> only for cases that have a screenshot (fallback otherwise)', () => {
    render(<StudioCases />);
    const withImage = cases.filter((c) => c.image).length;
    expect(screen.queryAllByRole('img')).toHaveLength(withImage);
  });

  it('links out only for cases that are reachable, not merely deployed', () => {
    render(<StudioCases />);
    const reachable = cases.filter((c) => c.liveUrl && c.access !== 'private').length;
    expect(screen.queryAllByRole('link', { name: /ver en vivo|view live/i })).toHaveLength(reachable);
  });

  it('never links a private case, however live it is', () => {
    // A private product resolves to a login form; sending a prospect there spends
    // the card's only click on a credentials screen.
    render(<StudioCases />);
    for (const c of cases.filter((x) => x.access === 'private')) {
      expect(screen.queryByRole('link', { name: new RegExp(c.client, 'i') })).toBeNull();
      const article = Array.from(document.querySelectorAll('#cases article')).find((a) =>
        a.querySelector('h3')?.textContent === c.title,
      );
      expect(article?.querySelector(':scope > div')?.className).not.toContain('hover:-translate-y-1');
    }
  });

  it('spans the lead case across two columns so the grid has no orphan cell', () => {
    // Five cards occupying six slots: 3+3 on lg, 2+2+2 on md.
    render(<StudioCases />);
    const articles = Array.from(document.querySelectorAll('#cases article'));
    expect(articles[0].className).toContain('md:col-span-2');
    for (const rest of articles.slice(1)) expect(rest.className).not.toContain('col-span-2');
  });

  it('keeps the reveal hook and the hover lift on separate elements', () => {
    // GSAP pins `translate/rotate/scale: none` inline on every element it animates,
    // which beats any Tailwind utility on those properties. So a hover lift on a
    // `.reveal` element renders nothing at all — and fails silently.
    render(<StudioCases />);
    for (const article of document.querySelectorAll('#cases article')) {
      expect(article.classList.contains('reveal')).toBe(true);
      expect(article.className).not.toContain('hover:-translate-y-1');
    }
  });
});
