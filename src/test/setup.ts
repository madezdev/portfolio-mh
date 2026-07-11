import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia; provide a permissive default so components
// that read prefers-reduced-motion render without throwing. Individual tests may
// still override window.matchMedia for specific assertions.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
