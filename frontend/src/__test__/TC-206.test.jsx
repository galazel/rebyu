// TC-206: Responsive navigation state
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper, deferred } from "./support/ui.jsx"
import userEvent from "@testing-library/user-event"
import { PortalTopNavigation } from "@/components/navigation/portal-navigation.jsx"

test("TC-206: Responsive navigation state", async (context) => {
  const user = userEvent.setup()
  render(<PortalTopNavigation role="ADMIN" />, { wrapper })
  const trigger = screen.getByRole("button", { name: "Open navigation" })
  expect(trigger).toHaveAttribute("aria-expanded", "false")
  await user.click(trigger)
  expect(trigger).toHaveAttribute("aria-expanded", "true")
  await user.keyboard("{Escape}")
  expect(trigger).toHaveAttribute("aria-expanded", "false")
}, 15000)
