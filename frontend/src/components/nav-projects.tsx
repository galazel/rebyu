"use client"

import type { LucideIcon } from "@/components/icons"
import { NavLink, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  name: string
  url: string
  icon: LucideIcon
  exact?: boolean
  activeUrls?: string[]
  /** A game-kit category: the item shows the page's coloured icon tile. */
  tone?: string
}

type NavGroup = {
  name: string
  items: NavItem[]
}

type NavProjectsProps = {
  projects: Record<string, NavGroup>
}

function normalizePath(path: string) {
  const normalized = path.replace(/\/+$/, "")

  return normalized || "/"
}

function isRouteActive(
    currentPath: string,
    routePath: string,
    exact = false
) {
  const current = normalizePath(currentPath)
  const route = normalizePath(routePath)

  if (exact) {
    return current === route
  }

  return current === route || current.startsWith(`${route}/`)
}

export function NavProjects({ projects }: NavProjectsProps) {
  const location = useLocation()

  return (
      <>
        {Object.values(projects).map((group) => (
            <SidebarGroup
                key={group.name}
                className="group-data-[collapsible=icon]:p-1"
            >
              <SidebarGroupLabel>{group.name}</SidebarGroupLabel>

              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {group.items.map((item) => {
                  const Icon = item.icon

                  const isMainRouteActive = isRouteActive(
                      location.pathname,
                      item.url,
                      item.exact
                  )

                  const isExtraRouteActive = (item.activeUrls ?? []).some(
                      (route) => isRouteActive(location.pathname, route)
                  )

                  const isActive = isMainRouteActive || isExtraRouteActive

                  if (item.tone) {
                    return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                              asChild
                              tooltip={item.name}
                              isActive={isActive}
                              className={`rb-nav-tile tg-cat-${item.tone} h-11 rounded-xl px-2 font-semibold group-data-[collapsible=icon]:p-0!`}
                          >
                            <NavLink to={item.url}>
                              <span className="tg-badge-icon !size-8 shrink-0"><Icon className="size-4" /></span>
                              <span>{item.name}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                  }

                  return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            asChild
                            tooltip={item.name}
                            isActive={isActive}
                            className={[
                              "rounded-none border-l-4 transition-colors group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:border-l-0",
                              isActive
                                  ? "border-l-sidebar-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                  : "border-l-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            ].join(" ")}
                        >
                          <NavLink to={item.url}>
                            <Icon className="size-4" />
                            <span>{item.name}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
        ))}
      </>
  )
}
