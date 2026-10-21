import * as React from "react"
import { NavLink } from "react-router-dom"
import {
  AwardIcon,
  BarChart3Icon,
  BookOpenCheckIcon,
  CalendarDays,
  CrownIcon,
  FilesIcon,
  LogOutIcon,
  TargetIcon,
  UserIcon,
  UsersRoundIcon,
} from "@/components/icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BrandLogo } from "@/components/brand-logo"
import { AiUsageSummary } from "@/components/learner/ai-usage.jsx"
import { NavProjects } from "@/components/nav-projects"
import { PortalThemeMenuItem } from "@/components/portal-theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"

const learnerNav = {
  learning: {
    name: "Learning",
    items: [
      { name: "Progress", url: "/learner/analytics", icon: BarChart3Icon, activeUrls: ["/learner/progress"] },
      { name: "Certifications", url: "/learner/certifications", icon: AwardIcon },
      { name: "My Learning", url: "/learner/learning", activeUrls: ["/learner/lessons"], icon: BookOpenCheckIcon },
      { name: "Mistake bank", url: "/learner/mistakes", icon: TargetIcon },
    ],
  },
  explore: {
    name: "Explore",
    items: [
      { name: "Community", url: "/learner/community", icon: UsersRoundIcon },
    ],
  },
  account: {
    name: "My account",
    items: [
      { name: "Account settings", url: "/learner/account", icon: UserIcon },
      { name: "Study calendar", url: "/learner/plan", icon: CalendarDays },
      { name: "Library", url: "/learner/library", icon: FilesIcon },
    ],
  },
}

type LearnerAppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  displayName: string
  email: string
  avatarUrl?: string | null
  onLogout: () => void
}

function initials(name = "", email = "") {
  return (name || email || "Learner")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function LearnerAppSidebar({
  displayName,
  email,
  avatarUrl,
  onLogout,
  ...props
}: LearnerAppSidebarProps) {
  const { state } = useSidebar()
  const expanded = state === "expanded"
  const entitlements = useLearnerEntitlements()
  const planLabel = entitlements.institutionalActive
    ? "Institution access"
    : entitlements.personalProActive
      ? "Pro learner"
      : "Free learner"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="shrink-0 flex-row items-center border-b border-sidebar-border p-2 group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="REBYU learner portal">
              <NavLink to="/learner/analytics" aria-label="REBYU learner portal home">
                <BrandLogo className="size-8!" />
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">REBYU</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">Learner portal</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger
          className="hidden shrink-0 md:inline-flex"
          aria-label={expanded ? "Collapse learner navigation" : "Expand learner navigation"}
          aria-expanded={expanded}
          title={expanded ? "Collapse navigation" : "Expand navigation"}
        />
      </SidebarHeader>

      <SidebarContent className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain group-data-[collapsible=icon]:overflow-y-auto">
        <NavProjects projects={learnerNav} />
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-sidebar-border p-2">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">AI usage</span>
            <NavLink to="/learner/subscription" aria-label={planLabel} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              <CrownIcon className="size-3.5" />
              {entitlements.institutionalActive ? "Institution" : entitlements.personalProActive ? "Pro" : "Free"}
            </NavLink>
          </div>
          <AiUsageSummary className="mt-3 border-0 bg-transparent p-0" showHeading={false} />
        </div>
        <SidebarMenu>
          <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
            <SidebarMenuButton asChild tooltip={planLabel} className="group-data-[collapsible=icon]:p-0!">
              <NavLink to="/learner/subscription" aria-label={planLabel}>
                <div className={`flex aspect-square size-8 items-center justify-center rounded-lg ${entitlements.hasPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <CrownIcon className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{planLabel}</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
                    <span className="truncate text-xs text-sidebar-foreground/60">{email || "Learner"}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-60 p-2">
                <DropdownMenuLabel>
                  <span className="block truncate">{displayName}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{email || "Learner"}</span>
                </DropdownMenuLabel>
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
