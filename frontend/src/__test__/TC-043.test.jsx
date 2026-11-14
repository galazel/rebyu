// TC-043: Lesson block rendering
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Covers heading, description and list block rendering. Media, tabs and accordion variants still need fixtures.
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
import { LessonContent } from "@/components/certifications/lesson-content-renderer.jsx"

test("TC-043: Lesson block rendering", async (context) => {
  render(
    <LessonContent
      structure={[
        { id: "h", type: "heading", data: { text: "Network Fundamentals" } },
        {
          id: "t",
          type: "description",
          data: { text: "A network connects devices." },
        },
        {
          id: "l",
          type: "unordered-list",
          data: { items: [{ id: "i", text: "Router" }] },
        },
      ]}
    />
  )
  expect(
    screen.getByRole("heading", { name: "Network Fundamentals" })
  ).toBeInTheDocument()
  expect(screen.getByText("A network connects devices.")).toBeInTheDocument()
  expect(screen.getByText("Router")).toBeInTheDocument()
}, 15000)
