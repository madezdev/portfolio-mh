import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioServices from './StudioServices';

describe('StudioServices', () => {
  it('renders the four outcome pillars', () => {
    render(<StudioServices />);
    expect(screen.getByText(/IA aplicada|Applied AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Productos y SaaS|Products & custom SaaS/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatizaciones|Automations/i)).toBeInTheDocument();
    const section = screen.getByText(/IA aplicada|Applied AI/i).closest('section');
    expect(section).toHaveAttribute('id', 'services');
  });
});
