import { useLocation, useNavigate } from "react-router-dom"
import { Building2Icon, HandshakeIcon } from "@/components/icons"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isDepartmentHeadUser, useAuth } from "@/context/auth-context.jsx"

import InstitutionProfilePage from "./institution-profile-page.jsx"
import InstitutionPartnershipPage from "./institution-partnership-page.jsx"

/**
 * The institution's own account, as one page.
 *
 * Profile and Partnership were separate routes behind a dropdown, and each was
 * a short read; neither was long enough to be a destination of its own.
 *
 * License and Files were tabs here too and are gone: the plan card repeated
 * what the partnership record already says, and the file list was an empty
 * shelf. The partnership table now carries the plan -- what was requested, what
 * it costs, and the button that renews it.
 *
 * They keep their own URLs, so an existing link or bookmark still lands where
 * it did; the tab is derived from the path rather than from state, and picking
 * a tab navigates. The header nav collapses to a single "Institution" entry.
 */
const TABS = [
  {
    value: "profile",
    path: "/institution/profile",
    label: "Profile",
    icon: Building2Icon,
    Panel: InstitutionProfilePage,
  },
  {
    value: "partnership",
    path: "/institution/partnership",
    label: "Partnership",
    icon: HandshakeIcon,
    Panel: InstitutionPartnershipPage,
  },
]

export default function InstitutionAccountPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // A department head has no business with the institution's own record or its
  // partnership: both belong to the owner. They reach this page only by typing
  // the URL -- the account menu does not offer it -- so it says so plainly
  // rather than rendering a tab strip with nothing in it.
  const isDepartmentHead = isDepartmentHeadUser(user)

  const active =
    TABS.find((tab) => location.pathname.startsWith(tab.path))?.value ?? TABS[0].value

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rb-display text-2xl font-extrabold tracking-tight">
          Institution
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your institution's details and its partnership with REBYU.
        </p>
      </div>

      {isDepartmentHead ? (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Only the institution owner can see the institution's record and its
          partnership.
        </p>
      ) : (
        <Tabs
          value={active}
          onValueChange={(value) => {
            const next = TABS.find((tab) => tab.value === value)
            if (next) navigate(next.path)
          }}
        >
          {/* Its own horizontal scroll container: the triggers must not be what
              makes the page scroll sideways on a narrow screen. */}
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList>
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                    <Icon className="size-4" aria-hidden="true" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {TABS.map(({ value, Panel }) => (
            /* Mounted only while selected. Each panel runs its own queries, and
               mounting both would fire two sets of requests to show one. */
            <TabsContent key={value} value={value} className="mt-6">
              {active === value ? <Panel /> : null}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
