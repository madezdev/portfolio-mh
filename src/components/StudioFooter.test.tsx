import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioFooter from './StudioFooter';

describe('StudioFooter', () => {
  it('renders the studio brand and the real current year', () => {
    render(<StudioFooter lang="es" />);
    expect(screen.getByText('madezdev')).toBeInTheDocument();
    const year = String(new Date().getFullYear());
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('uses the real GitHub handle, not the placeholder', () => {
    render(<StudioFooter lang="es" />);
    const gh = screen.getByRole('link', { name: /github/i });
    expect(gh.getAttribute('href')).toContain('madezdev');
    expect(gh.getAttribute('href')).not.toContain('martin-dev');
  });

  it('renders the tagline in Spanish', () => {
    render(<StudioFooter lang="es" />);
    expect(screen.getByText('Llevamos tus ideas digitales del concepto a la realidad.')).toBeInTheDocument();
  });

  it('renders the tagline in English', () => {
    render(<StudioFooter lang="en" />);
    expect(screen.getByText('We turn your digital ideas from concept into reality.')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioFooter lang="en" />);
    expect(container.textContent).not.toContain('Llevamos tus ideas digitales del concepto a la realidad.');
  });
});
