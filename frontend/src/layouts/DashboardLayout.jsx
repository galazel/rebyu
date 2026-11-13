import { Suspense } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { PortalPageSkeleton } from "@/components/portal-page-skeleton.jsx"
import { LogOutIcon } from "@/components/icons"
import { NotificationBell } from "@/components/notification-bell.jsx"
import { TaggingJobWatcher } from "@/components/question-bank/tagging-job-watcher.jsx"
import { CertificationsPageSkeleton } from "@/components/admin/certifications-page-skeleton.jsx"
import { PortalTopNavigation } from "@/components/navigation/portal-navigation.jsx"
import { PortalThemeMenuItem } from "@/components/portal-theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { defaultAvatarFor } from "@/lib/avatar-presets.js"
import { useAvatarUrl } from "@/hooks/use-avatar-url.js"
import { useAuth } from "@/context/auth-context.jsx"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"
import { useNotifications } from "@/hooks/use-notifications.js"
import "@/styles/admin-mobile.css"

export default function DashboardLayout() {
  usePortalTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const BLEED_PATHS = [
    /^\/admin\/certification\/[^/]+$/,
  ]

  // Full-height workspaces own their scroll container, so <main> is pinned to the viewport below the topbar.
  const FILL_PATHS = [
    /^\/admin\/certification\/[^/]+\/(question-bank|assessments)(\/.*)?$/,
    /^\/admin\/lessons\/[^/]+\/create$/,
  ]

  const isBleedPage = BLEED_PATHS.some((pattern) => pattern.test(location.pathname))
  const isFillPage = FILL_PATHS.some((pattern) => pattern.test(location.pathname))
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
    <div className="rebyu-ds netacad-portal admin-portal flex min-h-screen flex-col">
      <PortalTopNavigation
        role="ADMIN"
        actions={
          <>
            {notificationBell}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open account menu">
                <Avatar>
                  <AvatarImage src={avatarUrl ?? defaultAvatarFor(user?.email ?? displayName)} alt="" className="bg-[#FDF1D6] object-cover" />
                  <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-60 p-2">
                <DropdownMenuLabel>
                  <span className="block truncate">{displayName}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email ?? "Administrator"}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <PortalThemeMenuItem />
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOutIcon /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
      <main data-route-content data-admin-workspace={location.pathname.includes("/lessons/") ? "lesson" : undefined} className={`rebyu-page ${isFillPage ? "rebyu-page-fill" : isBleedPage ? "rebyu-page-bleed" : ""}`}>
        <Suspense fallback={location.pathname.replace(/\/+$/, "") === "/admin" ? <CertificationsPageSkeleton /> : <PortalPageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <TaggingJobWatcher />
    </div>
  )
}
