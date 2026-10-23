import { useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { LogOutIcon } from "@/components/icons"
import { BrandLogo } from "@/components/brand-logo"
import { NavProjects } from "@/components/nav-projects"
import { adminGroups } from "@/components/navigation/portal-navigation.jsx"
import { PortalThemeMenuItem } from "@/components/portal-theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"

const navigation = Object.fromEntries(adminGroups.map((group) => [group.label, {
  name: group.label,
  items: group.items.map((item) => ({
    name: item.label === "Platform overview" ? "Dashboard" : item.label,
    url: item.href,
    icon: item.icon,
    exact: item.href === "/admin",
    activeUrls: item.href === "/admin" ? ["/admin/certification"] : item.href === "/admin/challenges" ? ["/admin/arenas", "/admin/seed-challenges"] : item.match,
  })),
}]))

function initials(name, email) {
  return (name || email || "Admin").split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

export function AdminAppSidebar({ displayName, email, avatarUrl, onLogout, ...props }) {
  const { state, setOpenMobile } = useSidebar()
  const { pathname } = useLocation()
  const expanded = state === "expanded"

  useEffect(() => { setOpenMobile(false) }, [pathname, setOpenMobile])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="shrink-0 flex-row items-center border-b border-sidebar-border p-2 group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="REBYU admin portal">
              <NavLink to="/admin/dashboard" aria-label="REBYU admin portal home">
                <BrandLogo className="size-8!" />
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">REBYU</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">Admin portal</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger className="hidden shrink-0 md:inline-flex" aria-label={expanded ? "Collapse admin navigation" : "Expand admin navigation"} aria-expanded={expanded} title={expanded ? "Collapse navigation" : "Expand navigation"} />
      </SidebarHeader>
      <SidebarContent className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain group-data-[collapsible=icon]:overflow-y-auto">
        <nav aria-label="Admin navigation" onClick={(event) => { if (event.target.closest("a")) setOpenMobile(false) }}>
          <NavProjects projects={navigation} />
        </nav>
      </SidebarContent>
      <SidebarFooter className="shrink-0 border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="Account menu" aria-label="Open account menu">
                  <Avatar className="size-8 rounded-lg">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
                    <AvatarFallback className="rounded-lg">{initials(displayName, email)}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">{email || "Administrator"}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-60 p-2">
                <DropdownMenuLabel><span className="block truncate">{displayName}</span><span className="block truncate text-xs font-normal text-muted-foreground">{email || "Administrator"}</span></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <PortalThemeMenuItem />
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onLogout}><LogOutIcon />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
