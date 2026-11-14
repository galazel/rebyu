// TC-019: Password reset error
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-019: Password reset error", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  auth.resetPasswordForEmail.mockResolvedValue({
    data: null,
    error: { code: "over_email_send_rate_limit", message: "Limit" },
  })
  await expect(requestPasswordReset("ivan@example.test")).rejects.toMatchObject(
    { name: "LimitExceededException" }
  )
}, 15000)
