import { vi } from "vitest"
const mocks = vi.hoisted(() => ({ request: vi.fn(), session: vi.fn() }))
export { mocks }
vi.mock("axios", () => ({ default: mocks.request }))
vi.mock("@/lib/supabase.js", () => ({
  supabase: { auth: { getSession: mocks.session } },
}))
