import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioTrust from './StudioTrust';
import { getClientLogos, getTestimonials } from '../data/cases';

// Contract against the REAL trust data. The section renders nothing until
// logo/testimonial data exists, and there is currently none in ../data/cases,
// so this only exercises the empty-state guard. Locale coverage (which needs
// the guard to pass) lives in StudioTrust.variants.test.tsx, which mocks the
// data module to force non-empty data — mirrors the StudioCases split.
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
});
