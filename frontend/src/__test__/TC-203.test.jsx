// TC-203: Delete confirmation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { renderCurriculum, admin } from "./support/admin-curriculum.jsx"

test("TC-203: Delete confirmation", async (context) => {
  await renderCurriculum()
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Delete major category Fundamentals",
    })
  )
  fireEvent.click(
    await screen.findByRole("button", { name: "Delete", exact: true })
  )
  await waitFor(() => expect(admin.remove).toHaveBeenCalledWith(7))
  await waitFor(() =>
    expect(
      screen.queryByRole("button", {
        name: "Delete major category Fundamentals",
      })
    ).not.toBeInTheDocument()
  )
}, 15000)
