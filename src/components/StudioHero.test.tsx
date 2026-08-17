import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioHero from './StudioHero';

describe('StudioHero', () => {
  it('renders the full tagline and both CTAs as real links', () => {
    render(<StudioHero lang="es" />);
    expect(screen.getByText(/del concepto|from concept/i)).toBeInTheDocument();
    expect(screen.getByText(/la realidad|to reality/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /definí tu proyecto|define your project/i }))
      .toHaveAttribute('href', '#ai');
    expect(screen.getByRole('link', { name: /ver casos|see our work/i }))
      .toHaveAttribute('href', '#cases');
  });

  it('labels the scroll cue from i18n rather than a hardcoded literal', () => {
    render(<StudioHero lang="es" />);
    const cue = screen.getByRole('link', { name: /bajar a servicios|scroll to services/i });
    expect(cue).toHaveAttribute('href', '#services');
    expect(cue).toHaveTextContent('scroll');
  });

  it('renders the headline in Spanish', () => {
    render(<StudioHero lang="es" />);
    expect(screen.getByText('Del concepto')).toBeInTheDocument();
  });

  it('renders the headline in English', () => {
    render(<StudioHero lang="en" />);
    expect(screen.getByText('From concept')).toBeInTheDocument();
  });

  it('separates the two headline lines in the extracted text', () => {
    // Regression: the lines are two sibling blocks, so the rendered layout looked
    // right while `h1.textContent` read "Del conceptoa la realidad" — and that
    // concatenation is what a crawler indexes as the page's strongest signal.
    const { container } = render(<StudioHero lang="es" />);
    expect(container.querySelector('h1')?.textContent).toBe('Del concepto a la realidad');
  });

  it('separates the two headline lines in English too', () => {
    const { container } = render(<StudioHero lang="en" />);
    expect(container.querySelector('h1')?.textContent).toBe('From concept to reality');
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioHero lang="en" />);
    expect(container.textContent).not.toContain('Del concepto');
  });
});
