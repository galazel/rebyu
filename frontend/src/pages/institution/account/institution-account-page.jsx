import { useLocation, useNavigate } from "react-router-dom"
import {
  Building2Icon,
  HandshakeIcon,
} from "@/components/icons"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context.jsx"

import InstitutionProfilePage from "./institution-profile-page.jsx"
import InstitutionPartnershipPage from "./institution-partnership-page.jsx"

/**
 * The institution's own account, as one page.
 *
 * Profile and Partnership are now tabs under the Institution section.
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

  // A department head only gets access to the profile tab, whereas the owner has access to partnership as well.
  const isDepartmentHead =
    Boolean(user?.departmentHeadRole) && user.departmentHeadRole !== "owner"
  const tabs = isDepartmentHead ? TABS.filter((tab) => tab.value === "profile") : TABS

  const active =
    tabs.find((tab) => location.pathname.startsWith(tab.path))?.value ?? tabs[0].value

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rb-display text-2xl font-extrabold tracking-tight">
          Institution
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your institution's details, partnership, plan, and shared files.
        </p>
      </div>

      <Tabs
        value={active}
        onValueChange={(value) => {
          const next = tabs.find((tab) => tab.value === value)
          if (next) navigate(next.path)
        }}
      >
        {/* Its own horizontal scroll container: the triggers must not be what
            makes the page scroll sideways on a narrow screen. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList>
            {tabs.map((tab) => {
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

        {tabs.map(({ value, Panel }) => (
          /* Mounted only while selected. Each of these panels runs its own
             queries, and mounting all five would fire five sets of requests to
             show one. */
          <TabsContent key={value} value={value} className="mt-6">
            {active === value ? <Panel /> : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
