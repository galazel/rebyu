import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Award,
  BarChart3,
  BookOpenCheck,
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
  // No Rankings entry: the XP leaderboard is a panel on Challenges now, beside
  // the challenge-points board. Two standings on two pages meant knowing which
  // board you wanted before you could find it.
  // No My Learning entry either: it now lives in the account menu next to the
  // mistake bank, the other place a learner returns to rather than discovers.
]

/* The bottom bar carries one destination the top bar does not.
 *
 * On a desktop the mistake bank is a click away in the account menu, and the
 * top nav is already five items of the product's main surfaces. On a phone
 * that menu is behind an avatar in the corner, which is a poor place to keep
 * the thing a learner opens straight after failing an attempt -- so the bar
 * gets it, and the top nav is left alone. Labelled "Mistakes" rather than
 * "Mistake bank": six labels share the width of a phone.
 */
const learnerMobileNavigation = [
  ...learnerNavigation,
  { label: "Mistakes", href: "/learner/mistakes", icon: Target },
]

/* What the bar says under each icon, where the top nav's wording does not fit.
 *
 * Six cells share the width of a phone -- about 54px of usable label at 375px,
 * against the ~74px "Certifications" needs -- so the full labels were being cut
 * to "Certifi...", "My Learn..." and "Communi...". Three truncated words that
 * all start differently are still readable; three that trail off mid-syllable
 * are not, and they made the bar look broken rather than dense. Shortened by
 * hand rather than by ellipsis, and only here: the top nav has the room for the
 * real names and keeps them. Anything absent falls back to `label`. */
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
      // No Question Bank entry: the bank is a tab inside each certification,
      // next to its curriculum and assessments, because that is the only scope
      // a question is authored in. No AI generation entry either -- a run is
      // watched in the modal that started it.
      { label: "Challenges", href: "/admin/challenges", icon: Swords },
    ],
  },
  {
    label: "Management",
    icon: ServerCog,
    items: [
      { label: "Institutions", href: "/admin/institutions", icon: Building2 },
      { label: "Partnership requests", href: "/admin/partnership-requests", icon: Handshake },
      // Who has paid (certification orders and Pro subscriptions), and the
      // test-mode PayMongo queue where an admin approves Pro.
      {
        label: "Payments",
        href: "/admin/subscriptions",
        icon: CreditCard,
        match: ["/admin/subscriptions", "/admin/payments"],
      },
      // No BKT delivery or Gamification entries: both are withdrawn from the
      // admin portal. Their pages and services still exist -- re-register the
      // routes in App.jsx and add the entries back here to bring them back.
      { label: "Learners", href: "/admin/learners", icon: Users },
      { label: "Community", href: "/admin/community", icon: UsersRound },
      // The stored pick-lists (industries, department names) every select reads.
      { label: "Reference lists", href: "/admin/reference-lists", icon: ListChecks },
    ],
  },
]

/* A department head works only inside their own departments, so their header
   carries just that workspace.
   It used to be empty, with a one-link strip repeated at the top of each page. */
const departmentHeadGroups = [
  {
    label: "My departments",
    icon: UsersRound,
    items: [
      {
        label: "My departments",
        href: "/institution/department-head",
        icon: UsersRound,
        match: [
          "/institution/department-head",
          "/institution/departments",
          "/institution/certifications",
        ],
      },
    ],
  },
]

// Groups now live inside Certifications (you create a group from within the
// certification it belongs to), so there's no standalone "Groups" nav item.
// Items flagged ownerOnly are hidden for a department head / other institution
// member -- only the institution owner sees them.
const departments = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      // One entry, because there is one page. "Institution overview" and
      // "Analytics" were two nav items onto what is now a single board -- the
      // same shape as the learner portal, which lists Analytics once.
      { label: "Institution overview", href: "/institution/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Certifications",
    icon: Award,
    items: [
      // No "Learners" entry. A learner belongs to the certification they were
      // invited to, and that is the only place the roster means anything -- so
      // they are reached through it ("View learners" on a certification card),
      // not from a top-level list of everyone in the institution.
      { label: "Certifications", href: "/institution/certifications", icon: Award },
    ],
  },
  {
    label: "Institution",
    icon: Building2,
    ownerOnly: true,
    items: [
      // One entry, because there is one page. Profile and Partnership were
      // short routes behind a menu; they are now tabs on
      // /institution/profile, and the old paths still open their own tab.
      // `match` keeps the header underlined on all of them, invoices
      // included -- an invoice is opened from the partnership table.
      {
        label: "Institution",
        href: "/institution/profile",
        icon: Building2,
        match: [
          "/institution/profile",
          "/institution/partnership",
          "/institution/invoices",
        ],
      },
    ],
  },
]

/**
 * Both institution-side roles: INSTITUTION is the institution's own (owner)
 * account, DEPARTMENT_HEAD is someone it created an account for. They share
 * the same portal and permissions -- see CognitoAuthService.isInstitutionRole.
 */
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
  // On the institution side this shows the institution's own name rather than
  // the generic word "Institution" -- a member works inside one specific
  // institution, and naming it is what makes the header useful to them. Falls
  // back to the generic label only while the profile is still loading.
  const label = role === "LEARNER"
    ? "Learn"
    : isInstitution
      ? institutionName || "Institution"
      : "Admin"

  /* An institution's portal leads with the school's own name, in full: it is
     the one thing on the bar that tells a member whose workspace they are in.
     The navigation moved to the right beside the account menu to make room. */
  if (isInstitution) {
    return (
      <NavLink to={home} className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${label} home`}>
        <BrandLogo className="size-8 shrink-0" />
        <span className="min-w-0 leading-none">
          <span className="block truncate font-heading text-[15px] font-bold tracking-tight sm:text-base" title={label}>
            {label}
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            REBYU · {role === "DEPARTMENT_HEAD" ? "Department workspace" : "Institution"}
          </span>
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

/** Shared trigger/link styling, so a single-page group and a dropdown sit on
 *  the same baseline and carry the same active underline. */
const navItemClass = (active) =>
  cn(
    "relative inline-flex h-10 items-center gap-1.5 px-3 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "rb-nav-active"
      : "text-muted-foreground",
  )

function GroupDropdown({ group, pathname }) {
  const active = group.items.some((item) => pathMatches(pathname, item))
  // A one-page group has no identity of its own, so it borrows the icon of the
  // page it opens rather than carrying a second, vaguer one.
  const Icon = group.icon ?? group.items[0]?.icon

  // A menu holding one page is a link wearing a menu's clothes: it costs a
  // click and a chevron promising choices that are not there. "Overview" was
  // exactly this -- a dropdown whose only entry went to /admin/dashboard.
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
  // A department head (non-owner) only ever acts within their own assigned
  // departments' workspace pages -- that navigation lives on
  // the page itself now (see department-head-dashboard-page.jsx /
  // institution-department-workspace-page.jsx), not in this header, and the
  // command-K search bar is hidden for them too since there's nothing
  // institution-wide left for it to search.
  // The explicit role is authoritative; the owner check still covers accounts
  // that predate DEPARTMENT_HEAD and have not been migrated yet.
  const isDepartmentHead =
    role === "DEPARTMENT_HEAD" || (role === "INSTITUTION" && !isInstitutionOwner)
  /* A learner has no groups at all. The ternary used to be ADMIN-or-else,
     which handed `departments` to the learner portal as well -- harmless
     only because every read of `groups` was guarded by a `role === "LEARNER"`
     branch that used the learner list instead. Naming the empty case here
     means those guards are no longer load-bearing: the mobile menu below is
     driven by `groups.length` alone, and with the old fallback it would have
     offered a learner the institution's own navigation. */
  const allGroups = role === "ADMIN" ? adminGroups : role === "LEARNER" ? [] : departments
  const groups = isDepartmentHead ? departmentHeadGroups : allGroups
  /* The palette searches every learner destination, so it uses the longer of
     the two lists -- a search box that cannot find a page the app has is worse
     than useless. */
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
        {/* Cap and padding track `.rebyu-page` in index.css. The two are
            independent declarations of the same gutter, so they have to move
            together — widening the page alone left the brand and the nav links
            indented relative to every heading underneath them. */}
        <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-4 px-3 sm:px-5 lg:px-6">
          <Brand role={role} institutionName={institutionName} />
          {/* Left-aligned against the logo for a learner. Centred, the links
              floated in the middle of the bar and shifted horizontally
              whenever the brand or the action cluster changed width -- next to
              the wordmark they have a fixed edge to start from. The
              institution/admin nav stays right-aligned, next to the account
              menu, to make room for the institution's own name in the brand. */}
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
            {/* No search control in the bar. It occupied the widest slot in the
                header to search a nav tree of at most a dozen destinations that
                are already on screen. The Ctrl-K palette below still opens on
                the shortcut for anyone who reaches for it. */}
            {/* Not for a learner. Below `lg` the learner portal already paints
                `LearnerMobileNavigation` across the bottom of the screen, with
                the same destinations in the same order -- a hamburger here put
                a second copy of that list one tap away in the corner, so a
                phone showed the navigation twice and neither copy explained
                the other. The bottom bar wins: it is always visible, it is
                inside thumb reach, and it carries the mistake bank the top nav
                does not. The other portals have no bar, so they keep theirs. */}
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
              /* `aria-label` carries the full name even though the visible
                 text is abbreviated -- a screen reader should hear
                 "Certifications", not "Certs". */
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

  /* Portaled to <body> rather than rendered where it sits in the layout.

     Every route is wrapped by `RouteTransition` in App.jsx, whose
     `.rb-route-enter` class animates a `transform` with `animation-fill-mode:
     both` -- so the wrapper keeps a transform applied for good, identity or
     not. Any non-`none` transform on an ancestor makes that ancestor the
     containing block for `position: fixed` descendants, so this bar was being
     fixed to the page rather than to the window: it sat at the very bottom of
     the document and a learner had to scroll to the end of a page to reach
     their own navigation.

     The same trick is used for the topic page's tutor button, and for the same
     reason. Portaling is what actually fixes it -- outside `.rb-route-enter`
     there is no transformed ancestor to be trapped by.

     The portal classes travel with it. The bar is built from tokens defined
     under `.netacad-portal` and `.rebyu-ds`; dropped straight into <body> it
     would resolve none of them and paint as unstyled text on no background. */
  if (typeof document === "undefined") {
    return null
  }
  return createPortal(
    <div className="rebyu-ds netacad-portal learner-portal">{bar}</div>,
    document.body
  )
}
