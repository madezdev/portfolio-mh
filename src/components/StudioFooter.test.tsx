import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioFooter from './StudioFooter';

describe('StudioFooter', () => {
  it('renders the studio brand and the real current year', () => {
    render(<StudioFooter />);
    expect(screen.getByText('madezdev')).toBeInTheDocument();
    const year = String(new Date().getFullYear());
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('uses the real GitHub handle, not the placeholder', () => {
    render(<StudioFooter />);
    const gh = screen.getByRole('link', { name: /github/i });
    expect(gh.getAttribute('href')).toContain('madezdev');
    expect(gh.getAttribute('href')).not.toContain('martin-dev');
  });
});
