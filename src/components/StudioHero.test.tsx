import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioHero from './StudioHero';

vi.mock('../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true, // assert static content renders even with motion off
}));

describe('StudioHero', () => {
  it('renders the full tagline and both CTAs as real links', () => {
    render(<StudioHero />);
    expect(screen.getByText(/del concepto|from concept/i)).toBeInTheDocument();
    expect(screen.getByText(/la realidad|to reality/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /definí tu proyecto|define your project/i }))
      .toHaveAttribute('href', '#ai');
    expect(screen.getByRole('link', { name: /ver casos|see our work/i }))
      .toHaveAttribute('href', '#cases');
  });
});
