import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// next/font/google runs a build-time loader that isn't available under vitest.
// Mock it so design-system modules (which self-host fonts via next/font) can be
// imported in component tests. Each font factory returns the shape next/font
// produces at build time (className + variable + style).
vi.mock('next/font/google', () => {
  const font = () => ({
    className: 'mock-font',
    variable: 'mock-font-variable',
    style: { fontFamily: 'mock-font' },
  });
  return { Plus_Jakarta_Sans: font, Source_Serif_4: font };
});

// Ensure the DOM is cleaned up between tests (RTL does not auto-cleanup with globals).
afterEach(() => {
  cleanup();
});
