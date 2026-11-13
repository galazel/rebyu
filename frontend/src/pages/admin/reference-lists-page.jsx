import { DetailedReferenceList } from "./reference-detailed-list.jsx"
import { BookOpen, Building2, ListChecks } from "@/components/icons"
import { REFERENCE_DEGREE_PROGRAM, REFERENCE_INSTITUTION, REFERENCE_PROGRAM } from "@/services/referenceService.js"

export default function ReferenceLists() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6 px-1 pb-10">
      <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.07] via-background to-background p-5 shadow-xs sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <ListChecks className="size-4" aria-hidden="true" />
              Catalog configuration
            </p>
            <h1 className="mt-2 font-rb-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Reference lists
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Maintain the academic structure shown across partnership requests, departments, and program setup.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground">Structure</p>
              <p className="mt-1 text-sm font-bold">Programs</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground">Curriculum</p>
              <p className="mt-1 text-sm font-bold">Degrees</p>
            </div>
            <div className="col-span-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 sm:col-span-1">
              <p className="text-xs font-semibold text-muted-foreground">Directory</p>
              <p className="mt-1 text-sm font-bold">Institutions</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailedReferenceList
          kind={REFERENCE_PROGRAM}
          title="Programs"
          description="Colleges and academic units used in partnership requests, with their degree programs and certifications."
          withCertifications
          fields={[
            { key: "code", label: "Code", placeholder: "e.g. CCS", max: 40 },
            { key: "label", label: "Name", placeholder: "e.g. College of Computer Studies", max: 150 },
            { key: "description", label: "Programs covered", max: 500, wide: true, optionsKind: REFERENCE_DEGREE_PROGRAM },
          ]}
        />
        <DetailedReferenceList
          kind={REFERENCE_DEGREE_PROGRAM}
          title="Degree programs"
          description="Programs that a department can add, such as BSIT or BSCS."
          fields={[
            { key: "code", label: "Code", placeholder: "e.g. BSIT", max: 40 },
            { key: "label", label: "Name", placeholder: "e.g. Bachelor of Science in Information Technology", max: 150 },
            { key: "category", label: "College", placeholder: "e.g. CCS", max: 150, wide: true },
          ]}
        />
        <DetailedReferenceList
          kind={REFERENCE_INSTITUTION}
          title="Institutions"
          description="The schools suggested in the institution name field when requesting a partnership. Institutions can still type a name that is not listed."
          className="xl:col-span-2"
          fields={[
            { key: "code", label: "Short name", placeholder: "e.g. UC Main", max: 40 },
            { key: "label", label: "Name", placeholder: "e.g. University of Cebu – Main Campus", max: 150 },
            { key: "description", label: "Address", placeholder: "e.g. J. Alcantara St., Cebu City", max: 500, wide: true },
            { key: "category", label: "Category", placeholder: "e.g. State Universities", max: 150, wide: true },
          ]}
        />
      </div>
    </div>
  )
}
