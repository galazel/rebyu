// TC-164: Checkout cancellation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
const verify = vi.hoisted(() => vi.fn())
vi.mock("@/services/subscriptionService.js", () => ({
  verifyLatestCheckout: verify,
}))
import Page from "@/pages/learner/subscription/subscription-checkout-result-page.jsx"

test("TC-164: Checkout cancellation", async (context) => {
  render(
    <MemoryRouter>
      <Page canceled />
    </MemoryRouter>
  )
  expect(screen.getByText("Checkout canceled")).toBeInTheDocument()
  expect(screen.queryByText("You're now on REBYU Pro")).not.toBeInTheDocument()
  expect(verify).not.toHaveBeenCalled()
}, 15000)
