import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioTrust from './StudioTrust';
import { getClientLogos, getTestimonials } from '../data/cases';

describe('StudioTrust', () => {
  it('renders the trust section when there is logo/testimonial data', () => {
    render(<StudioTrust />);
    const hasData = getClientLogos().length > 0 || getTestimonials().length > 0;
    if (hasData) {
      expect(screen.getByText(/confían en nosotros|trusted by/i)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/confían en nosotros|trusted by/i)).toBeNull();
    }
  });
});
