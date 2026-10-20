import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Shared test environment setup.
 *
 * jsdom does not implement a few browser APIs that our components touch
 * indirectly (theme detection, Leaflet's resize handling), so they are stubbed
 * here instead of being mocked inside every test file.
 */

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in window)) {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverStub,
  });
}

if (!window.scrollTo) {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() });
}

beforeEach(() => {
  // Every test starts from a clean client-side session.
  localStorage.clear();
  document.documentElement.className = '';
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
