import React from "react"
import { vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { wrapper } from "./ui.jsx"
const auth = vi.hoisted(() => ({
  signOut: vi.fn(async () => ({ error: null })),
  signUp: vi.fn(),
  verifyOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
  getUser: vi.fn(),
}))
const transport = vi.hoisted(() => ({ base: vi.fn(), token: vi.fn() }))
export { auth, transport }
vi.mock("@/lib/supabase.js", () => ({ supabase: { auth } }))
vi.mock("@/services/base", () => ({ API: "/api", base: transport.base }))
vi.mock("@/services/learnerService.js", () => ({
  getLearnerPortalData: vi.fn(async () => ({})),
}))
vi.mock("@/hooks/use-presence-heartbeat.js", () => ({
  usePresenceHeartbeat: vi.fn(),
}))

export function session(token = "header.eyJzdWIiOiJ0ZXN0In0.signature") {
  auth.getSession.mockResolvedValue({
    data: { session: { access_token: token } },
  })
  transport.base.mockResolvedValue({
    role: "LEARNER",
    learnerId: 7,
    email: "ivan@example.test",
  })
}
