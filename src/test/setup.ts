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

// jsdom does not implement ResizeObserver either. It never reports a resize here
// (nothing in jsdom lays out), so an inert stub is the honest stand-in: components
// that observe an element still get their initial measurement and never throw.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
