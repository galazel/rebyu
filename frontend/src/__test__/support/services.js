import { vi } from "vitest"
const request = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
export { request, toast }
vi.mock("@/services/base", () => ({
  base: request,
  API: "/api",
  currentAccessToken: vi.fn(async () => "token"),
}))
vi.mock("sonner", () => ({ toast }))
