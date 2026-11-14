// TC-013: Login success
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-013: Login success", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  session()
  auth.signInWithPassword.mockResolvedValue({
    data: { user: { user_metadata: {} } },
    error: null,
  })
  const Wrapped = ({ children }) =>
    React.createElement(
      wrapper,
      null,
      React.createElement(AuthProvider, null, children)
    )
  const { result } = renderHook(() => useAuth(), { wrapper: Wrapped })
  await waitFor(() => expect(result.current.status).toBe("authenticated"))
  await act(() => result.current.login("ivan@example.test", "Abcdef1!"))
  expect(result.current.user).toMatchObject({ learnerId: 7 })
  expect(auth.signInWithPassword).toHaveBeenCalledWith({
    email: "ivan@example.test",
    password: "Abcdef1!",
  })
}, 15000)
