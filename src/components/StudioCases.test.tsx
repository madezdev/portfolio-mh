import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioCases from './StudioCases';
import { cases } from '../data/cases';

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

  it('renders a live link only for cases that have a liveUrl', () => {
    render(<StudioCases />);
    const withLive = cases.filter((c) => c.liveUrl).length;
    expect(screen.queryAllByRole('link', { name: /ver en vivo|view live/i })).toHaveLength(withLive);
  });
});
