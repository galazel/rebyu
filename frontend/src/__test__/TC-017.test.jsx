// TC-017: Invalid verification
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-017: Invalid verification", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  auth.verifyOtp.mockResolvedValue({
    data: null,
    error: { code: "otp_expired", message: "Expired" },
  })
  await expect(
    confirmRegistration("ivan@example.test", "000000")
  ).rejects.toMatchObject({ name: "ExpiredCodeException" })
  expect(auth.signOut).not.toHaveBeenCalled()
}, 15000)
