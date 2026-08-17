import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioServices from './StudioServices';

describe('StudioServices', () => {
  it('renders the four outcome pillars in Spanish', () => {
    render(<StudioServices lang="es" />);
    expect(screen.getByText('IA aplicada')).toBeInTheDocument();
    expect(screen.getByText('Automatizaciones')).toBeInTheDocument();
    const section = screen.getByText('IA aplicada').closest('section');
    expect(section).toHaveAttribute('id', 'services');
  });

  it('renders the four outcome pillars in English', () => {
    render(<StudioServices lang="en" />);
    expect(screen.getByText('Applied AI')).toBeInTheDocument();
    expect(screen.getByText('Automations')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioServices lang="en" />);
    expect(container.textContent).not.toContain('IA aplicada');
  });
});
