import { Suspense } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { PortalPageSkeleton } from "@/components/portal-page-skeleton.jsx"
import { TaggingJobWatcher } from "@/components/question-bank/tagging-job-watcher.jsx"
import { AdminSidebar } from "@/components/navigation/admin-sidebar.jsx"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/context/auth-context.jsx"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"

export default function DashboardLayout() {
  usePortalTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isBleedPage = /^\/admin\/certification\/[^/]+$/.test(location.pathname)
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="netacad-portal admin-portal min-h-screen">
      <SidebarProvider>
        <AdminSidebar user={user} onLogout={handleLogout} />
        <SidebarInset className="min-w-0">
          <div className="px-3 pt-3 md:hidden">
            <SidebarTrigger aria-label="Open admin navigation" />
          </div>
          <main className={`rebyu-page ${isBleedPage ? "rebyu-page-bleed" : ""}`}>
            <Suspense fallback={<PortalPageSkeleton />}><Outlet /></Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <TaggingJobWatcher />
    </div>
  )
}
