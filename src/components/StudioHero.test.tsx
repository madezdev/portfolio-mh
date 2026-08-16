import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioHero from './StudioHero';

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

  it('labels the scroll cue from i18n rather than a hardcoded literal', () => {
    render(<StudioHero />);
    const cue = screen.getByRole('link', { name: /bajar a servicios|scroll to services/i });
    expect(cue).toHaveAttribute('href', '#services');
    expect(cue).toHaveTextContent('scroll');
  });
});
