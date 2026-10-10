import { useParams } from "react-router-dom"

import QuestionImportWorkspace from "@/components/question-bank/question-import-workspace.jsx"

export default function CertificationPdfImportPage() {
    const { id: certificationId } = useParams()
    return (
        <QuestionImportWorkspace
            certificationId={certificationId}
            exitPath={`/admin/certification/${certificationId}/question-bank`}
        />
    )
}
