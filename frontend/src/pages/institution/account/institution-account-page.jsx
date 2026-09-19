import { useLocation, useNavigate } from "react-router-dom"
import {
  Building2Icon,
  FilesIcon,
  HandshakeIcon,
  SparklesIcon,
} from "@/components/icons"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context.jsx"

import InstitutionFilesPage from "./institution-files-page.jsx"
import InstitutionLicensePage from "./institution-license-page.jsx"
import InstitutionProfilePage from "./institution-profile-page.jsx"
import InstitutionPartnershipPage from "./institution-partnership-page.jsx"

/**
 * The institution's own account, as one page.
 *
 * Profile, Partnership, License and Files were separate routes behind a
 * dropdown, and every one of them was a short read: a contact form,
 * a request status, a plan card, a file list. Nothing on any
 * of them was long enough to be a destination, and telling them apart from
 * their labels was guesswork.
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
  {
    value: "license",
    path: "/institution/license",
    label: "License",
    icon: SparklesIcon,
    Panel: InstitutionLicensePage,
  },
  {
    value: "files",
    path: "/institution/files",
    label: "Files",
    icon: FilesIcon,
    Panel: InstitutionFilesPage,
  },
]

export default function InstitutionAccountPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // A group leader has no business with the institution's plan or
  // partnership record -- Files is the only one of these they are sent to (from
  // the account menu), so it is the only one they get.
  const isInstitutionMember =
    Boolean(user?.institutionMemberRole) && user.institutionMemberRole !== "owner"
  const tabs = isInstitutionMember ? TABS.filter((tab) => tab.value === "files") : TABS

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
