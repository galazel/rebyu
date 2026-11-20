import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/context/auth-context.jsx"
import { TodaysPlanTile } from "@/components/learner/todays-plan-tile.jsx"
import "@/index.css"

const context = { data: { enrolledCertifications: [{ certificationId: 14, title: "FE Exam" }], lessons: [] } }
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
}

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={client}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <main style={{ maxWidth: 900, margin: "0 auto" }}>
            <Where />
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<TodaysPlanTile />} />
              </Route>
            </Routes>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>,
)
