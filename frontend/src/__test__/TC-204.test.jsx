// TC-204: Reference-list lookup
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
import { useReferenceOptions } from "@/services/referenceService.js"

test("TC-204: Reference-list lookup", async (context) => {
  request.mockResolvedValue([{ id: 7, label: "Information Technology" }])
  const { result } = renderHook(() => useReferenceOptions("PROGRAM"), {
    wrapper,
  })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.options).toEqual([
    { id: 7, label: "Information Technology" },
  ])
  expect(request).toHaveBeenCalledWith("public/reference/PROGRAM")
}, 15000)
