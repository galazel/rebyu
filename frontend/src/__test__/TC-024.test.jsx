// TC-024: Logout
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-024: Logout", async (context) => {
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
  await act(() => result.current.logout())
  expect(result.current.status).toBe("anonymous")
  expect(result.current.user).toBeNull()
  expect(localStorage.getItem("learnerId")).toBeNull()
  expect(sessionStorage.getItem("rebyu:auth-user-snapshot")).toBeNull()
  expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" })
}, 15000)
