import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom"
import DashboardLayout from "../../src/layouts/DashboardLayout.jsx"
import { ThemeProvider } from "../../src/components/theme-provider"
import { TooltipProvider } from "../../src/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
import "../../src/styles/rebyu-print.css"

function Page() {
  const { pathname } = useLocation()
  window.adminSidebarPath = pathname
  return <><div><h1 className="font-heading text-3xl">{pathname === "/admin/dashboard" ? "Dashboard" : pathname.split("/").at(-1)}</h1><p className="mt-1 text-sm text-muted-foreground">Platform overview across learners, institutions, and certifications.</p></div><div className="grid gap-5 md:grid-cols-3">{["Active users", "Online now", "Taking a certification"].map((label) => <section key={label} className="rounded-xl border bg-card p-6"><h2 className="font-semibold">{label}</h2><p className="mt-8 font-heading text-5xl">12</p></section>)}</div><section className="h-[1000px] rounded-xl border bg-card p-6">Admin content remains independently scrollable.</section></>
}
createRoot(document.getElementById("root")).render(<QueryClientProvider client={new QueryClient()}><ThemeProvider defaultTheme="light" storageKey="admin-sidebar-test-theme"><TooltipProvider><MemoryRouter initialEntries={["/admin/dashboard"]}><Routes><Route path="/admin" element={<DashboardLayout />}><Route index element={<Page />} /><Route path="*" element={<Page />} /></Route><Route path="/login" element={<h1>Logged out</h1>} /></Routes></MemoryRouter></TooltipProvider></ThemeProvider></QueryClientProvider>)
