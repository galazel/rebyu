import "@testing-library/jest-dom/vitest"
import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

// A test must explicitly mock every transport it uses. Never contact live APIs.
vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("Unmocked network request in unit test")
  })
)
if (typeof window !== "undefined") {
  window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true
    },
  }))
  HTMLElement.prototype.scrollTo = vi.fn()
  HTMLElement.prototype.scrollIntoView = vi.fn()
  HTMLElement.prototype.hasPointerCapture = () => false
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal("IntersectionObserver", Observer)
  vi.stubGlobal("ResizeObserver", Observer)
}
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  globalThis.localStorage?.clear?.()
  globalThis.sessionStorage?.clear?.()
  vi.clearAllMocks()
})
