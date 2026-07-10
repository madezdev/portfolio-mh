import { describe, it, expect } from 'vitest';
import { cases, getTestimonials, getClientLogos, type Case } from './cases';

describe('cases data module', () => {
  it('every case has the required fields and a valid category', () => {
    const cats = ['web', 'product', 'automation', 'ai'];
    for (const c of cases) {
      expect(c.id && c.client && c.title && c.summary && c.image).toBeTruthy();
      expect(cats).toContain(c.category);
    }
  });
  it('derives testimonials only from cases that have them', () => {
    const withT = cases.filter((c) => c.testimonial).length;
    expect(getTestimonials()).toHaveLength(withT);
  });
  it('derives client logos only from cases that have a logo', () => {
    const withLogo = cases.filter((c) => c.logo).length;
    expect(getClientLogos()).toHaveLength(withLogo);
  });
});
