// TC-016: Email verification
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-016: Email verification", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  auth.verifyOtp.mockResolvedValue({ data: {}, error: null })
  await confirmRegistration("ivan@example.test", "123456")
  expect(auth.verifyOtp).toHaveBeenCalledWith({
    email: "ivan@example.test",
    token: "123456",
    type: "email",
  })
  expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" })
}, 15000)
