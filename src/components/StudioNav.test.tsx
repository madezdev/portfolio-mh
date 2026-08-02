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

  it('centres the section links on the page, not on the space left over', () => {
    // jsdom has no layout, so guard the structure that produces the centring:
    // three tracks with equal outer columns beats `justify-between`, which offsets
    // the links by half the excess width of the actions over the wordmark.
    render(<StudioNav />);
    const nav = document.querySelector('header nav');
    expect(nav?.className).toContain('grid-cols-[1fr_auto_1fr]');
    expect(nav?.className).not.toContain('justify-between');

    // Explicit placement matters: the links are display:none below md, and without
    // it the actions would collapse into the middle track on mobile.
    const [, links, actions] = Array.from(nav!.children);
    expect(links.className).toContain('col-start-2');
    expect(actions.className).toContain('col-start-3');
  });

  it('keeps the CTA label on a single line', () => {
    // The equal outer track is narrower than the actions' natural width on small
    // desktops, and a wrappable label gets squeezed into two lines there.
    render(<StudioNav />);
    const cta = screen.getByRole('link', { name: /agendá una llamada|book a call/i });
    expect(cta.className).toContain('whitespace-nowrap');
  });
});
