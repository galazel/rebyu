import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Award,
  BarChart3,
  BookOpenCheck,
  Bot,
  Building2,
  ChevronDown,
  CircleHelp,
  Command,
  FileQuestion,
  Handshake,
  CreditCard,
  LayoutDashboard,
  Menu,
  ServerCog,
  Search,
  Swords,
  Target,
  Users,
  UsersRound,
  X,
  ListChecks,
  Play,
  Trophy,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const learnerNavigation = [
  { label: "Analytics", href: "/learner/analytics", icon: BarChart3 },
  { label: "Certifications", href: "/learner/certifications", icon: Award },
  { label: "Challenges", href: "/learner/challenges", icon: Swords },
  { label: "Community", href: "/learner/community", icon: UsersRound },
]

const learnerMobileNavigation = [
  ...learnerNavigation,
  { label: "Mistakes", href: "/learner/mistakes", icon: Target },
]

const LEARNER_TAB_LABELS = {
  "/learner/analytics": "Progress",
  "/learner/certifications": "Certs",
  "/learner/learning": "Learn",
  "/learner/community": "Circle",
}

const adminGroups = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { label: "Platform overview", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Learning",
    icon: BookOpenCheck,
    items: [
      { label: "Certifications", href: "/admin", icon: Award },
      { label: "Challenges", href: "/admin/challenges", icon: Swords },
    ],
  },
  {
    label: "Management",
    icon: ServerCog,
    items: [
      { label: "Institutions", href: "/admin/institutions", icon: Building2 },
      { label: "Partnership", href: "/admin/partnership-requests", icon: Handshake },
      {
        label: "Payments",
        href: "/admin/subscriptions",
        icon: CreditCard,
        match: ["/admin/subscriptions", "/admin/payments"],
      },
      { label: "Learners", href: "/admin/learners", icon: Users },
      { label: "Community", href: "/admin/community", icon: UsersRound },
      { label: "Reference lists", href: "/admin/reference-lists", icon: ListChecks },
      { label: "Pricing & plans", href: "/admin/pricing", icon: CreditCard },
      { label: "Rewards & XP", href: "/admin/rewards", icon: Trophy },
      { label: "Seed challenges", href: "/admin/seed-challenges", icon: Play },
      { label: "AI settings", href: "/admin/ai-settings", icon: Bot },
    ],
  },
]

const departmentHeadGroups = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      {
        label: "Overview",
        href: "/institution/department-head",
        icon: LayoutDashboard,
        match: ["/institution/department-head"],
      },
    ],
  },
  {
    label: "Programs",
    icon: UsersRound,
    items: [
      {
        label: "Programs",
        href: "/institution/programs",
        icon: UsersRound,
        match: ["/institution/programs", "/institution/departments"],
      },
    ],
  },
]

const departments = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { label: "Institution overview", href: "/institution/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Certifications",
    icon: Award,
    items: [
      { label: "Certifications", href: "/institution/certifications", icon: Award },
    ],
  },
]

export function isInstitutionRole(role) {
  return role === "INSTITUTION" || role === "DEPARTMENT_HEAD"
}

function pathMatches(pathname, item) {
  const candidates = item.match ?? [item.href]
  return candidates.some((path) => pathname === path || (path !== "/admin" && pathname.startsWith(`${path}/`)))
}

function Brand({ role, institutionName }) {
  const isInstitution = isInstitutionRole(role)
  const home = role === "LEARNER"
    ? "/learner/analytics"
    : isInstitution
      ? "/institution/dashboard"
      : "/admin/dashboard"
  const label = role === "LEARNER"
    ? "Learn"
    : isInstitution
      ? institutionName || "Institution"
      : "Admin"

  if (isInstitution) {
    const scopeLabel = role === "DEPARTMENT_HEAD" ? "DEPARTMENT" : "INSTITUTION"
    return (
      <NavLink
        to={home}
        className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${institutionName || "Institution"} - REBYU home`}
      >
        <BrandLogo className="size-8 shrink-0" />
        <span className="min-w-0 flex flex-col justify-center leading-none">
          <span className="flex items-baseline gap-1 sm:gap-1.5 leading-none">
            <span className="font-heading text-lg font-bold tracking-tight text-white sm:text-xl">
              REBYU
            </span>
            <span className="font-heading text-xs font-semibold uppercase tracking-wider text-slate-300/80 sm:text-sm">
              {scopeLabel}
            </span>
          </span>

          {institutionName ? (
            <span
              className="mt-[1px] block max-w-[200px] truncate text-[11px] font-medium uppercase tracking-wide leading-none text-[#f5a623] sm:max-w-xs sm:text-xs md:max-w-md"
              style={{ fontFamily: "var(--font-institution-body, 'Poppins', sans-serif)" }}
              title={institutionName}
            >
              {institutionName}
            </span>
          ) : null}
        </span>
      </NavLink>
    )
  }

  return (
    <NavLink to={home} className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={role === "LEARNER" ? "REBYU home and analytics" : "REBYU home"}>
      <BrandLogo className="size-8" />
      <span className="hidden leading-none sm:block">
        <span className="block font-heading text-[15px] font-bold tracking-tight">REBYU</span>
        <span
          className="mt-1 block max-w-40 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          title={isInstitution && institutionName ? institutionName : undefined}
        >
          {label}
        </span>
      </span>
    </NavLink>
  )
}

const navItemClass = (active) =>
  cn(
    "relative inline-flex h-10 items-center gap-1.5 px-3 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "rb-nav-active"
      : "text-muted-foreground",
  )

function GroupDropdown({ group, pathname }) {
  const active = group.items.some((item) => pathMatches(pathname, item))
  const Icon = group.icon ?? group.items[0]?.icon

  if (group.items.length === 1) {
    const only = group.items[0]
    return (
      <NavLink to={only.href} className={navItemClass(active)}>
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
        {group.label}
      </NavLink>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={navItemClass(active)}>
          {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
          {group.label}
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60 p-2">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">{group.label}</DropdownMenuLabel>
        {group.items.map((item) => <NavigationMenuItem key={item.href} item={item} />)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavigationMenuItem({ item }) {
  const Icon = item.icon
  return (
    <DropdownMenuItem asChild>
      <NavLink to={item.href} className="flex items-center gap-3 py-2.5">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    </DropdownMenuItem>
  )
}

export function CommandPalette({ open, onOpenChange, items }) {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    return value ? items.filter((item) => `${item.label} ${item.group ?? ""}`.toLowerCase().includes(value)) : items
  }, [items, query])

  useEffect(() => { if (!open) setQuery("") }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12vh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogHeader className="sr-only"><DialogTitle>Command palette</DialogTitle><DialogDescription>Search and open a REBYU destination.</DialogDescription></DialogHeader>
        <label className="flex items-center gap-3 border-b px-4">
          <Search className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Search destinations</span>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </label>
        <div className="max-h-[min(440px,60vh)] overflow-y-auto p-2">
          {results.length ? results.map((item) => {
            const Icon = item.icon ?? CircleHelp
            return <button key={item.href} type="button" onClick={() => { navigate(item.href); onOpenChange(false) }} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"><Icon className="size-4 text-muted-foreground" /><span className="flex-1">{item.label}</span>{item.group ? <span className="text-xs text-muted-foreground">{item.group}</span> : null}</button>
          }) : <p className="px-3 py-10 text-center text-sm text-muted-foreground">No destinations match “{query}”.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PortalTopNavigation({ role, actions, institutionName, isOwner = true }) {
  const location = useLocation()
  const [commandOpen, setCommandOpen] = useState(false)
  const isInstitutionOwner = isOwner
  const isDepartmentHead =
    role === "DEPARTMENT_HEAD" || (role === "INSTITUTION" && !isInstitutionOwner)
  const allGroups = role === "ADMIN" ? adminGroups : role === "LEARNER" ? [] : departments
  const groups = isDepartmentHead ? departmentHeadGroups : allGroups
  const commandItems = role === "LEARNER" ? learnerMobileNavigation.map((item) => ({ ...item, group: "Learner" })) : groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true) }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-4 px-3 sm:px-5 lg:px-6">
          <Brand role={role} institutionName={institutionName} />
          <nav className={cn("hidden min-w-0 flex-1 items-center gap-1 lg:flex", isInstitutionRole(role) ? "justify-end" : "justify-start")} aria-label={`${role.toLowerCase()} navigation`}>
            {role === "LEARNER"
              ? learnerNavigation.slice(0, 6).map((item) => {
                  const Icon = item.icon
                  const active = pathMatches(location.pathname, item)
                  return (
                    <NavLink
                      key={`${item.label}-${item.href}`}
                      to={item.href}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "rb-nav-active"
                          : "text-muted-foreground",
                      )}
                    >
                      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                      {item.label}
                    </NavLink>
                  )
                })
              : groups.map((group) => (
                  <GroupDropdown key={group.label} group={group} pathname={location.pathname} />
                ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-1.5 lg:flex-none">
            {groups.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  {groups.map((group, index) => <div key={group.label}><DropdownMenuLabel>{group.label}</DropdownMenuLabel>{group.items.map((item) => <NavigationMenuItem key={item.href} item={item} />)}{index < groups.length - 1 ? <DropdownMenuSeparator /> : null}</div>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {actions}
          </div>
        </div>
      </header>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
    </>
  )
}

export function LearnerMobileNavigation() {
  const location = useLocation()

  const bar = (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Mobile learner navigation">
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${learnerMobileNavigation.length}, minmax(0, 1fr))` }}>
        {learnerMobileNavigation.map((item) => {
          const Icon = item.icon
          const active = pathMatches(location.pathname, item)
          return (
            <NavLink
              key={`${item.label}-${item.href}`}
              to={item.href}
              aria-label={item.label}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-medium leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                active ? "rb-mobile-active" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="max-w-full truncate">
                {LEARNER_TAB_LABELS[item.href] ?? item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )




  if (typeof document === "undefined") {
    return null
  }
  return createPortal(
    <div className="rebyu-ds netacad-portal learner-portal">{bar}</div>,
    document.body
  )
}
