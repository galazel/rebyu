import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/context/auth-context.jsx"
import InstitutionDepartmentLearnerPage from "@/pages/institution/departments/institution-department-learner-page.jsx"
import "@/index.css"

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={client}>
    <AuthProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={["/institution/departments/1/learners/9"]}>
          <main style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
            <Routes>
              <Route
                path="/institution/departments/:departmentId/learners/:learnerId"
                element={<InstitutionDepartmentLearnerPage />}
              />
            </Routes>
          </main>
        </MemoryRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>,
)
