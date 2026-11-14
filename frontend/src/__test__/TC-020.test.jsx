// TC-020: New password mismatch
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper, deferred } from "./support/ui.jsx"
vi.mock("@/context/auth-context.jsx", () => ({
  useAuth: () => ({ setNewPassword: request }),
  roleHomePath: () => "/learner/analytics",
}))
vi.mock("@/services/authService.js", () => ({
  currentSessionEmail: async () => "ivan@example.test",
  toSafeAuthMessage: (e) => e.message,
}))
vi.mock("@/pages/auth/auth-shell.jsx", () => ({
  default: ({ children }) => <main>{children}</main>,
}))
import Page from "@/pages/auth/set-new-password-page.jsx"

test("TC-020: New password mismatch", async (context) => {
  render(<Page />, { wrapper })
  await waitFor(() =>
    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(2)
  )
  const inputs = document.querySelectorAll('input[type="password"]')
  expect(inputs).toHaveLength(2)
  fireEvent.change(inputs[0], { target: { value: "Abcdef1!" } })
  fireEvent.change(inputs[1], { target: { value: "Different1!" } })
  fireEvent.submit(document.querySelector("form"))
  expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument()
  expect(request).not.toHaveBeenCalled()
}, 15000)
