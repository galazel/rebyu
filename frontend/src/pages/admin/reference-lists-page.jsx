import { DetailedReferenceList } from "./reference-detailed-list.jsx"
import { REFERENCE_INSTITUTION, REFERENCE_PROGRAM } from "@/services/referenceService.js"

export default function ReferenceLists() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold">Reference lists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The pick-lists every form draws from. Retired entries stay on the records that already use them.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <DetailedReferenceList
          kind={REFERENCE_PROGRAM}
          title="Programs"
          description="The colleges and programs an institution picks from when requesting a partnership, and which certifications sit under each."
          withCertifications
          fields={[
            { key: "code", label: "Code", placeholder: "e.g. CCS", max: 40 },
            { key: "label", label: "Name", placeholder: "e.g. College of Computer Studies", max: 150 },
            { key: "description", label: "Programs covered", placeholder: "e.g. BSIT, BSCS, and ACT Programs", max: 500, wide: true },
          ]}
        />
        <DetailedReferenceList
          kind={REFERENCE_INSTITUTION}
          title="Institutions"
          description="The schools suggested in the institution name field when requesting a partnership. Institutions can still type a name that is not listed."
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
