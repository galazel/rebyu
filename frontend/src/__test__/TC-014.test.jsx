// TC-014: Login failure
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-014: Login failure", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  auth.signInWithPassword.mockResolvedValue({
    data: null,
    error: { code: "invalid_credentials", message: "Invalid" },
  })
  await expect(
    loginWithCognito("ivan@example.test", "wrong")
  ).rejects.toMatchObject({ name: "NotAuthorizedException" })
  expect(toSafeAuthMessage({ name: "NotAuthorizedException" })).toBe(
    "Incorrect email or password."
  )
}, 15000)
