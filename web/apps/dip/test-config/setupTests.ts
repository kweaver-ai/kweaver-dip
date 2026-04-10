import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Mock react-intl-universal
vi.mock('react-intl-universal', () => ({
  default: {
    get: (key: string) => key,
    getHTML: (key: string) => key,
    init: vi.fn().mockResolvedValue({}),
    load: vi.fn().mockResolvedValue({}),
  },
}))

// iconfont runtime scripts directly touch browser globals and are not needed in unit tests.
vi.mock('@/assets/fonts/iconfont.js', () => ({}))
vi.mock('@/assets/fonts/color-iconfont.js', () => ({}))
vi.mock('@/assets/fonts/dip-studio-iconfont.js', () => ({}))
vi.mock('@/assets/fonts/kw-icon.js', () => ({}))
vi.mock('@/assets/fonts/kw-color-icon.js', () => ({}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const originalGetComputedStyle = window.getComputedStyle.bind(window)
Object.defineProperty(window, 'getComputedStyle', {
  configurable: true,
  writable: true,
  value: (elt: Element) => originalGetComputedStyle(elt),
})

globalThis.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb
  }
  observe() {
    queueMicrotask(() => {
      this.callback([], this as unknown as ResizeObserver)
    })
  }
  disconnect() {}
  unobserve() {}
} as typeof ResizeObserver

afterEach(() => {
  cleanup()
})
