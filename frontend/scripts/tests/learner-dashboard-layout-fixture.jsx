import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/context/auth-context.jsx"
import LearnerProgressPage from "@/pages/learner/dashboard/learner-progress-page.jsx"
import "@/index.css"

const context = { data: { enrolledCertifications: [{ certificationId: 14, title: "FE Exam" }] } }
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={client}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <main style={{ maxWidth: 1600, margin: "0 auto" }}>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="/__learner_dashboard_test" element={<LearnerProgressPage />} />
              </Route>
            </Routes>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>,
)
