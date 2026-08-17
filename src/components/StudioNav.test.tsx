import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioNav from './StudioNav';

describe('StudioNav', () => {
  it('renders the studio brand and the primary CTA', () => {
    render(<StudioNav lang="es" />);
    expect(screen.getByText('madezdev')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /agendá una llamada|book a call/i })).toBeInTheDocument();
  });

  it('links the CTA to the contact anchor', () => {
    render(<StudioNav lang="es" />);
    const cta = screen.getByRole('link', { name: /agendá una llamada|book a call/i });
    expect(cta).toHaveAttribute('href', '#contact');
  });

  it('centres the section links on the page from md, not on the space left over', () => {
    // jsdom has no layout, so guard the structure that produces the centring:
    // three tracks with equal outer columns beats `justify-between`, which offsets
    // the links by half the excess width of the actions over the wordmark.
    render(<StudioNav lang="es" />);
    const nav = document.querySelector('header nav');
    expect(nav?.className).toContain('md:grid-cols-[1fr_auto_1fr]');

    // Explicit placement matters: the links are display:none below md, and without
    // it the actions would collapse into the middle track on mobile.
    const [, links, actions] = Array.from(nav!.children);
    expect(links.className).toContain('col-start-2');
    expect(actions.className).toContain('col-start-3');
  });

  it('drops the equal-column rule on phones, where it crushed the language toggle', () => {
    // Below md the links are hidden, so there is nothing to centre — but the equal
    // outer track still capped the actions at the wordmark's width and squeezed the
    // segmented toggle from 88px down to 10px.
    render(<StudioNav lang="es" />);
    const nav = document.querySelector('header nav');
    expect(nav?.className).toContain('justify-between');
    expect(nav?.className).toContain('md:justify-normal');
    // The grid only applies from md; unprefixed `grid` would reinstate the bug.
    expect(nav?.className).not.toMatch(/(^|\s)grid(\s|$)/);
    expect(nav?.className).not.toMatch(/(^|\s)grid-cols-/);
  });

  it('shrinks nothing but keeps the toggle at its natural width', () => {
    // The toggle is the only flex child that can shrink, so it is the one that
    // breaks unless it is explicitly pinned.
    render(<StudioNav lang="es" />);
    const toggle = document.querySelector('header [role="group"]');
    expect(toggle?.parentElement?.className).toContain('shrink-0');
  });

  it('swaps to a short CTA label on phones without changing its accessible name', () => {
    // The full label plus the wordmark and the toggle need 357px of a 375px bar.
    render(<StudioNav lang="es" />);
    const cta = screen.getByRole('link', { name: /agendá una llamada|book a call/i });
    const [short, full] = Array.from(cta.querySelectorAll('span'));
    expect(short.className).toContain('md:hidden');
    expect(full.className).toContain('hidden');
    expect(short.textContent).not.toBe(full.textContent);
    // The accessible name must come from aria-label, not from whichever span the
    // viewport happens to show.
    expect(cta).toHaveAttribute('aria-label');
  });

  it('keeps the CTA label on a single line', () => {
    // The equal outer track is narrower than the actions' natural width on small
    // desktops, and a wrappable label gets squeezed into two lines there.
    render(<StudioNav lang="es" />);
    const cta = screen.getByRole('link', { name: /agendá una llamada|book a call/i });
    expect(cta.className).toContain('whitespace-nowrap');
  });

  it('renders the section links in Spanish', () => {
    render(<StudioNav lang="es" />);
    expect(screen.getByText('Servicios')).toBeInTheDocument();
  });

  it('renders the section links in English', () => {
    render(<StudioNav lang="en" />);
    expect(screen.getByText('Services')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioNav lang="en" />);
    expect(container.textContent).not.toContain('Servicios');
  });
});
