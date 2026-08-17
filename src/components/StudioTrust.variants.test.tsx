import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// The real trust data is empty today (see StudioTrust.test.tsx), so the guard
// `if (logos.length === 0 && testimonials.length === 0) return null;` fires
// before locale strings ever render. Locale coverage has to force non-empty
// data to reach past the guard — mirrors StudioCases.variants.test.tsx.
const state = vi.hoisted(() => ({
  logos: [] as { client: string; logo: string }[],
  testimonials: [] as { client: string; quote: string; author: string; role: string }[],
}));

vi.mock('../data/cases', () => ({
  getClientLogos: () => state.logos,
  getTestimonials: () => state.testimonials,
}));

const { default: StudioTrust } = await import('./StudioTrust');

describe('StudioTrust — locale coverage with trust data present', () => {
  beforeEach(() => {
    state.logos = [];
    state.testimonials = [{ client: 'Acme', quote: 'Great work.', author: 'Jane Doe', role: 'CTO' }];
  });

  it('renders the section title in Spanish when there is trust data', () => {
    render(<StudioTrust lang="es" />);
    expect(screen.getByText('Confían en nosotros')).toBeInTheDocument();
  });

  it('renders the section title in English when there is trust data', () => {
    render(<StudioTrust lang="en" />);
    expect(screen.getByText('Trusted by')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioTrust lang="en" />);
    expect(container.textContent).not.toContain('Confían en nosotros');
  });
});
