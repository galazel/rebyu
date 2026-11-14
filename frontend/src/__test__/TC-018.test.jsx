// TC-018: Password reset request
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-018: Password reset request", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  auth.resetPasswordForEmail.mockResolvedValue({
    data: { sent: true },
    error: null,
  })
  await expect(requestPasswordReset("ivan@example.test")).resolves.toEqual({
    sent: true,
  })
  expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("ivan@example.test")
}, 15000)
