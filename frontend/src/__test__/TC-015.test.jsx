// TC-015: Empty login
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import { auth, transport, session } from "./support/auth.jsx"

test("TC-015: Empty login", async (context) => {
  const {
    registerAccount,
    loginWithCognito,
    confirmRegistration,
    requestPasswordReset,
    toSafeAuthMessage,
  } = await import("@/services/authService.js")
  const { AuthProvider, useAuth } = await import("@/context/auth-context.jsx")
  await expect(loginWithCognito("", "valid")).rejects.toMatchObject({
    name: "EmptySignInUsername",
  })
  await expect(loginWithCognito("ivan@example.test", "")).rejects.toMatchObject(
    { name: "EmptySignInPassword" }
  )
  expect(auth.signInWithPassword).not.toHaveBeenCalled()
}, 15000)
