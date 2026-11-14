import React from "react"
import { vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  lookup: vi.fn(),
  department: vi.fn(),
  navigate: vi.fn(),
}))
export { mocks }
vi.mock("@/pages/auth/auth-shell.jsx", () => ({
  default: ({ children, title }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}))
vi.mock("react-router-dom", async (original) => ({
  ...(await original()),
  useNavigate: () => mocks.navigate,
}))
vi.mock("@/services/authService.js", () => ({
  registerAccount: mocks.register,
  toSafeAuthMessage: (error) => error.message,
}))
vi.mock("@/services/partnershipService.js", () => ({
  getRegistrationRequest: mocks.lookup,
  lookupDepartmentHeadCode: mocks.department,
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
import RegisterPage from "@/pages/auth/register-page.jsx"

export function registration(type = "learner") {
  mocks.register.mockReset().mockResolvedValue({ status: "SIGNED_UP" })
  mocks.lookup
    .mockReset()
    .mockResolvedValue({
      institutionEmail: "school@example.test",
      institutionName: "School",
      contactPersonName: "Ivan Cortes",
    })
  mocks.department.mockReset().mockResolvedValue({ email: "head@example.test" })
  return render(
    <MemoryRouter initialEntries={["/signup?type=" + type]}>
      <RegisterPage />
    </MemoryRouter>
  )
}
export function fillRegistration(overrides = {}) {
  const values = {
    "First name": "Ivan",
    "Last name": "Cortes",
    Email: "ivan@example.test",
    Password: "Abcdef1!",
    "Confirm password": "Abcdef1!",
    ...overrides,
  }
  for (const [label, value] of Object.entries(values)) {
    const input = screen.queryByLabelText(label, { exact: true })
    if (input) fireEvent.change(input, { target: { value } })
  }
}
export function submitRegistration() {
  fireEvent.click(screen.getByRole("button", { name: /Create account/i }))
}
