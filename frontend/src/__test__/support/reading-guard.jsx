import React from "react"
import { vi } from "vitest"
import { render } from "@testing-library/react"
import { wrapper } from "./ui.jsx"

// Shared mocks for the skim-challenge cooldown (admin setting + learner hook).
const guard = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))
export { guard }
vi.mock("sonner", () => ({ toast: guard.toast }))
vi.mock("@/services/base.js", () => ({
  apiMessage: (error, fallback) =>
    error?.response?.data?.message ?? fallback,
}))
vi.mock("@/services/aiSettingsService.js", () => ({
  getReadingGuardSettings: guard.get,
  updateReadingGuardSettings: guard.put,
}))

export async function renderGuardCard() {
  const { ReadingGuardSettingsCard } =
    await import("@/components/admin/reading-guard-settings.jsx")
  return render(<ReadingGuardSettingsCard />, { wrapper })
}
