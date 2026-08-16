import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioProcess from './StudioProcess';

describe('StudioProcess', () => {
  it('renders the four journey steps in the #process section', () => {
    render(<StudioProcess />);
    expect(document.getElementById('process')).not.toBeNull();
    for (const label of [/idea/i, /diseño|design/i, /construcción|build/i, /producción|production/i]) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
  });
  it('numbers the steps 01..04', () => {
    render(<StudioProcess />);
    for (const n of ['01', '02', '03', '04']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });
});
