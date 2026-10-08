import { Suspense, useMemo } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { PortalPageSkeleton } from "@/components/portal-page-skeleton.jsx"
import { LogOutIcon, SettingsIcon } from "@/components/icons"

import { PortalTopNavigation } from "@/components/navigation/portal-navigation.jsx"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getMyInstitutionProfile } from "@/services/institutionService.js"
import { isDepartmentHeadUser, useAuth } from "@/context/auth-context.jsx"
import { useNotifications } from "@/hooks/use-notifications.js"
import { NotificationBell } from "@/components/notification-bell.jsx"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"
import { PortalThemeMenuItem } from "@/components/portal-theme-toggle"

function getInitials(name = "") {
  return (
    name
      .split(/\s/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "OR"
  )
}

export default function InstitutionLayout() {
  usePortalTheme()
  const navigate = useNavigate()
  const { user, logout: authLogout } = useAuth()
  const authInstitutionId = user?.institutionId ?? null

  const scopedQuery = useQuery({
    queryKey: ["institution", authInstitutionId],
    queryFn: () => getMyInstitutionProfile(),
    enabled: authInstitutionId != null,
    staleTime: 60_000,
    retry: 1,
  })

  const institution = useMemo(() => {
    if (authInstitutionId != null) {
      return scopedQuery.data ?? null
    }
    return null
  }, [authInstitutionId, scopedQuery.data])

  const outletContext = useMemo(
    () => ({
      institution,
      institutionLoading: scopedQuery.isLoading,
      institutionError: scopedQuery.isError,
      refetchInstitution: scopedQuery.refetch,
    }),
    [institution, scopedQuery.isLoading, scopedQuery.isError, scopedQuery.refetch]
  )

  const orgName = institution?.institutionName ?? "Institution"
  const isDepartmentHead = isDepartmentHeadUser(user)
  const portalRole = (user?.role ?? "").toUpperCase() === "DEPARTMENT_HEAD"
    ? "DEPARTMENT_HEAD"
    : "INSTITUTION"
  const notifications = useNotifications()

  const logout = async () => {
    await authLogout()
    localStorage.removeItem("institution_id")
    localStorage.removeItem("institutionId")
    navigate("/login", { replace: true })
  }

  return (
    <div className="netacad-portal institution-portal flex min-h-screen flex-col">
      <PortalTopNavigation role={portalRole} institutionName={orgName} isOwner={!isDepartmentHead} actions={<>
            <NotificationBell
              items={notifications.items}
              unreadCount={notifications.unreadCount}
              loading={notifications.isLoading}
              emptyMessage="Partnership and invitation updates will appear here."
              onItemOpen={notifications.open}
              onMarkAllRead={notifications.markAllRead}
              onDelete={(item) => notifications.remove(item.id)}
            />


           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <button
                 type="button"
                 className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                 aria-label="Open account menu"
               >
                 <Avatar>
                   <AvatarFallback>{getInitials(orgName)}</AvatarFallback>
                 </Avatar>
               </button>
             </DropdownMenuTrigger>
             <DropdownMenuContent
               align="end"
               sideOffset={10}
               className="w-56 p-2"
             >
               <DropdownMenuLabel>
                 <span className="block truncate">{orgName}</span>
                 <span className="block truncate text-xs font-normal text-muted-foreground">
                   {user?.email || "Institution"}
                 </span>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               {isDepartmentHead ? null : (
                 <>
                   <DropdownMenuItem onClick={() => navigate("/institution/profile")}>
                     <SettingsIcon />
                     Institution
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                 </>
               )}
               <PortalThemeMenuItem />
               <DropdownMenuSeparator />
               <DropdownMenuItem variant="destructive" onClick={logout}>
                 <LogOutIcon />
                 Log out
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
      </>} />

        <main className="rebyu-page">
          <Suspense fallback={<PortalPageSkeleton />}>
            <Outlet context={outletContext} />
          </Suspense>
        </main>
    </div>
  )
}
