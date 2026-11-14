// TC-021: Session restoration
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-021: Session restoration", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  session()
  const Wrapped = ({ children }) =>
    React.createElement(
      wrapper,
      null,
      React.createElement(AuthProvider, null, children)
    )
  const { result } = renderHook(() => useAuth(), { wrapper: Wrapped })
  await waitFor(() => expect(result.current.status).toBe("authenticated"))
  expect(result.current.user).toMatchObject({ learnerId: 7, role: "LEARNER" })
}, 15000)
