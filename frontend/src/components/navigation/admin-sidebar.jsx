import { NavLink } from "react-router-dom"
import { LogOutIcon } from "@/components/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BrandLogo } from "@/components/brand-logo"
import { NavProjects } from "@/components/nav-projects"
import { PortalThemeMenuItem } from "@/components/portal-theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import { adminGroups } from "@/components/navigation/portal-navigation.jsx"

const navigation = Object.fromEntries(adminGroups.map((group) => [group.label, {
  name: group.label,
  items: group.items.map((item) => ({
    name: item.label, url: item.href, icon: item.icon,
    exact: item.href === "/admin", activeUrls: item.match,
  })),
}]))

export function AdminSidebar({ user, onLogout }) {
  const { state } = useSidebar()
  const expanded = state === "expanded"
  const name = user?.displayName || user?.email || "Administrator"
  const initials = name.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("")
  return (
    <Sidebar collapsible="icon">
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
        <NavProjects projects={navigation} />
      </SidebarContent>
      <SidebarFooter className="shrink-0 border-t border-sidebar-border p-2">
        <SidebarMenu><SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" tooltip="Account menu" aria-label="Open account menu">
                <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">{initials}</AvatarFallback></Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">{user?.email || "Administrator"}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-60 p-2">
              <DropdownMenuLabel><span className="block truncate">{name}</span><span className="block truncate text-xs font-normal text-muted-foreground">{user?.email || "Administrator"}</span></DropdownMenuLabel>
              <DropdownMenuSeparator /><PortalThemeMenuItem /><DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}><LogOutIcon />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem></SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
