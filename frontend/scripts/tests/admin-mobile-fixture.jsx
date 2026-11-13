import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "../../src/components/ui/tooltip"
import { ThemeProvider } from "../../src/components/theme-provider"
import DashboardLayout from "../../src/layouts/DashboardLayout.jsx"
import AiSettings from "../../src/pages/admin/ai-settings-page.jsx"
import Rewards from "../../src/pages/admin/rewards-management-page.jsx"
import CreateLessons from "../../src/pages/admin/create-lessons-page.jsx"
import { LearnerAppSidebar } from "../../src/components/learner/learner-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../src/components/ui/sidebar"
import { ai, live } from "./admin-mobile-data.mjs"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
client.setQueryData(["ai-settings"], ai)
client.setQueryData(["live-tutor-settings"], live)
client.setQueryData(["admin-rewards"], { lowScoreMinXp: 10, coinsPerAiCredit: 25 })
client.setQueryData(["certification-review-levels"], Array.from({ length: 20 }, (_, i) => ({ levelNumber: i + 1, title: "Review level with a long descriptive title", requiredXp: i * 100 })))
const route = new URLSearchParams(location.search).get("page") || "ai-settings"
createRoot(document.getElementById("root")).render(<QueryClientProvider client={client}><ThemeProvider defaultTheme="light" storageKey="admin-mobile-fixture-theme"><TooltipProvider><MemoryRouter initialEntries={[`/admin/${route}`]}><Routes>
  <Route path="/admin" element={<DashboardLayout />}>
    <Route path="ai-settings" element={<AiSettings />} />
    <Route path="rewards" element={<Rewards />} />
    <Route path="lessons/:name/create" element={<CreateLessons />} />
    <Route path="learner-menu" element={<SidebarProvider><LearnerAppSidebar displayName="Learner With A Long Name" email="long.learner.email@example.test" onLogout={() => {}} /><SidebarInset><SidebarTrigger aria-label="Open learner drawer" /></SidebarInset></SidebarProvider>} />
    <Route path="*" element={<p>Selected admin page</p>} />
  </Route>
</Routes></MemoryRouter></TooltipProvider></ThemeProvider></QueryClientProvider>)
