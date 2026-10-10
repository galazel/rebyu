import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import QuestionImportWorkspace from "@/components/question-bank/question-import-workspace.jsx"
import { InstitutionErrorState, InstitutionLoadingSkeleton } from "@/components/institution/institution-ui.jsx"
import { getDepartmentById } from "@/services/institutionService.js"

/** The admin's PDF/Word question import, for a department: everything it saves is the department's. */
export default function InstitutionQuestionImportPage() {
    const { departmentId } = useParams()
    const id = Number(departmentId)

    const departmentQuery = useQuery({
        queryKey: ["department", id],
        queryFn: () => getDepartmentById(id),
        enabled: Number.isFinite(id),
    })
    const certificationId =
        departmentQuery.data?.certificationId ?? departmentQuery.data?.institutionCert?.certificationId ?? null

    if (departmentQuery.isLoading) {
        return (
            <div className="p-6">
                <InstitutionLoadingSkeleton rows={4} />
            </div>
        )
    }
    if (departmentQuery.isError || certificationId == null) {
        return (
            <div className="p-6">
                <InstitutionErrorState
                    title="This department has no certification"
                    description="Questions are imported into the certification your department teaches."
                />
            </div>
        )
    }
    return (
        <QuestionImportWorkspace
            certificationId={String(certificationId)}
            ownerDepartmentId={id}
            exitPath={`/institution/departments/${id}?tab=question-bank`}
        />
    )
}
