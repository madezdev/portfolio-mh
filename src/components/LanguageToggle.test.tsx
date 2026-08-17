import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LanguageToggle from './LanguageToggle';

describe('LanguageToggle', () => {
  it('renders a crawlable link per locale', () => {
    render(<LanguageToggle lang="es" />);
    expect(screen.getByRole('link', { name: 'Español' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/');
  });

  it('annotates each link with the language it points to', () => {
    render(<LanguageToggle lang="es" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('hreflang', 'en');
  });

  it('marks the active locale with aria-current', () => {
    render(<LanguageToggle lang="en" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Español' })).not.toHaveAttribute('aria-current');
  });

  it('renders no buttons — switching locale is navigation', () => {
    render(<LanguageToggle lang="es" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
