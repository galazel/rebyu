import { Link } from "react-router-dom"

import { ArrowLeft, HistoryIcon } from "@/components/icons"
import { CertificationArchives } from "@/components/institution/allocation-learners.jsx"
import { Button } from "@/components/ui/button"

export default function InstitutionCertificationArchivesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <HistoryIcon className="size-4" aria-hidden="true" />
            Certification history
          </p>
          <h1 className="mt-1 font-rb-display text-2xl font-bold text-foreground">Archived terms</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Expired certification terms and their frozen learner records remain available here for review and export.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/institution/certifications">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Active certifications
          </Link>
        </Button>
      </header>

      <CertificationArchives showHeading={false} />
    </div>
  )
}
