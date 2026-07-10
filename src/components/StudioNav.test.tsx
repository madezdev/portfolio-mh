import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioNav from './StudioNav';

describe('StudioNav', () => {
  it('renders the studio brand and the primary CTA', () => {
    render(<StudioNav />);
    expect(screen.getByText('madezdev')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /agendá una llamada|book a call/i })).toBeInTheDocument();
  });

  it('links the CTA to the contact anchor', () => {
    render(<StudioNav />);
    const cta = screen.getByRole('link', { name: /agendá una llamada|book a call/i });
    expect(cta).toHaveAttribute('href', '#contact');
  });
});
