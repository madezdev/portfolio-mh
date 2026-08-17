import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudioProcess from './StudioProcess';

describe('StudioProcess', () => {
  it('renders the four journey steps in the #process section', () => {
    render(<StudioProcess lang="es" />);
    expect(document.getElementById('process')).not.toBeNull();
    for (const label of [/idea/i, /diseño|design/i, /construcción|build/i, /producción|production/i]) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
  });
  it('numbers the steps 01..04', () => {
    render(<StudioProcess lang="es" />);
    for (const n of ['01', '02', '03', '04']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });

  it('renders the section title in Spanish', () => {
    render(<StudioProcess lang="es" />);
    expect(screen.getByText('Del concepto a la realidad, paso a paso')).toBeInTheDocument();
  });

  it('renders the section title in English', () => {
    render(<StudioProcess lang="en" />);
    expect(screen.getByText('From concept to reality, step by step')).toBeInTheDocument();
  });

  it('does not leak the other locale into the output', () => {
    const { container } = render(<StudioProcess lang="en" />);
    expect(container.textContent).not.toContain('Del concepto a la realidad, paso a paso');
  });
});
