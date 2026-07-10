import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioCases from './StudioCases';
import { cases } from '../data/cases';

describe('StudioCases', () => {
  it('renders a card for every case with an accessible image and title', () => {
    render(<StudioCases />);
    const section = document.getElementById('cases');
    expect(section).not.toBeNull();
    // one img per case (alt = client or title)
    expect(screen.getAllByRole('img').length).toBe(cases.length);
    // each case title appears
    for (const c of cases) expect(screen.getByText(c.title)).toBeInTheDocument();
  });
  it('renders a live link only for cases that have a liveUrl', () => {
    render(<StudioCases />);
    const withLive = cases.filter((c) => c.liveUrl).length;
    expect(screen.getAllByRole('link', { name: /ver en vivo|view live/i })).toHaveLength(withLive);
  });
});
