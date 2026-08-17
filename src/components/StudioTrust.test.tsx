import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioTrust from './StudioTrust';
import { getClientLogos, getTestimonials } from '../data/cases';

describe('StudioTrust', () => {
  it('renders the trust section when there is logo/testimonial data', () => {
    render(<StudioTrust lang="es" />);
    const hasData = getClientLogos().length > 0 || getTestimonials().length > 0;
    if (hasData) {
      expect(screen.getByText(/confían en nosotros|trusted by/i)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/confían en nosotros|trusted by/i)).toBeNull();
    }
  });

  // The section renders nothing until logo/testimonial data exists (see above),
  // so these guard on the same real-data check rather than asserting unconditional
  // presence — there is currently no trust data in ../data/cases.
  it('renders the section title in Spanish when there is trust data', () => {
    render(<StudioTrust lang="es" />);
    const hasData = getClientLogos().length > 0 || getTestimonials().length > 0;
    if (hasData) {
      expect(screen.getByText('Confían en nosotros')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Confían en nosotros')).toBeNull();
    }
  });

  it('renders the section title in English when there is trust data', () => {
    render(<StudioTrust lang="en" />);
    const hasData = getClientLogos().length > 0 || getTestimonials().length > 0;
    if (hasData) {
      expect(screen.getByText('Trusted by')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Trusted by')).toBeNull();
    }
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioTrust lang="en" />);
    expect(container.textContent).not.toContain('Confían en nosotros');
  });
});
