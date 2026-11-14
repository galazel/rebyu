// TC-165: Subscription entitlement
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
vi.mock("@/services/learnerService.js", () => ({
  getCurrentLearnerIdentity: () => ({ learnerId: 7 }),
}))
vi.mock("@/services/subscriptionService.js", () => ({
  getLearnerEntitlements: (...args) => request(...args),
}))
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"

test("TC-165: Subscription entitlement", async (context) => {
  request.mockResolvedValue({ accessSource: "PRO", features: ["AI_TUTOR"] })
  const { result } = renderHook(() => useLearnerEntitlements(1), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.hasFeature("AI_TUTOR")).toBe(true)
  expect(result.current.hasFeature("UNKNOWN_FEATURE")).toBe(false)
  expect(result.current.hasPremium).toBe(true)
}, 15000)
