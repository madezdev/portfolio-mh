import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  it('renders a section with the given id and children', () => {
    render(<Section id="hero">hello</Section>);
    const section = screen.getByText('hello').closest('section');
    expect(section).toHaveAttribute('id', 'hero');
  });
});
