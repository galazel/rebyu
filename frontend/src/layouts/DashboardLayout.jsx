import { Suspense, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { PortalPageSkeleton } from "@/components/portal-page-skeleton.jsx"
import { NotificationBell } from "@/components/notification-bell.jsx"
import { TaggingJobWatcher } from "@/components/question-bank/tagging-job-watcher.jsx"
import { AdminAppSidebar } from "@/components/admin/admin-sidebar.jsx"
import { CertificationsPageSkeleton } from "@/components/admin/certifications-page-skeleton.jsx"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PortalTopbar } from "@/components/navigation/portal-topbar.jsx"
import { buildPortalContentItems } from "@/lib/portal-content-search.js"
import { getAllCertifications } from "@/services/certificationService.js"
import { useAvatarUrl } from "@/hooks/use-avatar-url.js"
import { useAuth } from "@/context/auth-context.jsx"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"
import { useNotifications } from "@/hooks/use-notifications.js"

export default function DashboardLayout() {
  usePortalTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchValue, setSearchValue] = useState("")
  const contentQuery = useQuery({
    queryKey: ["admin-certifications"],
    queryFn: () => getAllCertifications(undefined, { includeComingSoon: true, summary: true }),
    enabled: searchValue.trim().length > 0,
    staleTime: 5 * 60_000,
  })
  const searchItems = useMemo(() => buildPortalContentItems({ role: "admin", certifications: contentQuery.data }), [contentQuery.data])
  const BLEED_PATHS = [
    /^\/admin\/certification\/[^/]+$/,
  ]

  const isBleedPage = BLEED_PATHS.some((pattern) => pattern.test(location.pathname))
  const { user, logout } = useAuth()
  const notifications = useNotifications()
  const displayName = user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Administrator"
  const avatarUrl = useAvatarUrl(user?.avatarKey ?? null)
  const notificationBell = (
    <NotificationBell items={notifications.items} unreadCount={notifications.unreadCount} loading={notifications.isLoading}
      emptyMessage="Partnership request updates will appear here." onItemOpen={notifications.open}
      onMarkAllRead={notifications.markAllRead} onDelete={(item) => notifications.remove(item.id)} />
  )

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="rebyu-ds netacad-portal admin-portal min-h-screen">
      <SidebarProvider>
        <AdminAppSidebar displayName={displayName} email={user?.email ?? ""} avatarUrl={avatarUrl} onLogout={handleLogout} />
        <SidebarInset className="min-w-0">
          <PortalTopbar role="admin" items={searchItems} notifications={notificationBell} value={searchValue} onValueChange={setSearchValue} loading={contentQuery.isLoading} error={contentQuery.isError} onRetry={() => contentQuery.refetch()} />
          <main className={`rebyu-page ${isBleedPage ? "rebyu-page-bleed" : ""}`}>
            <Suspense fallback={location.pathname.replace(/\/+$/, "") === "/admin" ? <CertificationsPageSkeleton /> : <PortalPageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <TaggingJobWatcher />
    </div>
  )
}
