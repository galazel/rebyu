import { DetailedReferenceList } from "./reference-detailed-list.jsx"
import { REFERENCE_DEGREE_PROGRAM, REFERENCE_INSTITUTION, REFERENCE_PROGRAM } from "@/services/referenceService.js"

export default function ReferenceLists() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto pb-8">
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
