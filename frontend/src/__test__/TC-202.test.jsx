// TC-202: Delete cancellation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { renderCurriculum, admin } from "./support/admin-curriculum.jsx"

test("TC-202: Delete cancellation", async (context) => {
  await renderCurriculum()
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Delete major category Fundamentals",
    })
  )
  expect(await screen.findByRole("alertdialog")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Keep it" }))
  await waitFor(() =>
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  )
  expect(admin.remove).not.toHaveBeenCalled()
}, 15000)
