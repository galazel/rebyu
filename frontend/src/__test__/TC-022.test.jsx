// TC-022: Unauthenticated route
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
vi.mock("@/context/auth-context.jsx", () => ({
  useAuth: () => ({ status: "anonymous", user: null }),
}))
import ProtectedRoute from "@/components/ProtectedRoute.jsx"

test("TC-022: Unauthenticated route", async (context) => {
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route
            path="/admin"
            element={<div>Secret administrator content</div>}
          />
        </Route>
        <Route path="/login" element={<div>Access redirected</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText("Access redirected")).toBeInTheDocument()
  expect(
    screen.queryByText("Secret administrator content")
  ).not.toBeInTheDocument()
}, 15000)
