import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

import { Button } from "@/components/ui/button"
import QuestionBank from "./question-bank-page.jsx"
import { getAllCertifications } from "@/services/certificationService.js"

export default function CertificationQuestionBankPage() {
  const { id: certificationId } = useParams()

  const { data: certifications = [], isLoading: certificationsLoading } = useQuery({
    queryKey: ["admin-certifications", "question-bank-page"],
    queryFn: () => getAllCertifications(undefined, { summary: true }),
    staleTime: 5 * 60 * 1000,
  })

  const certification = useMemo(
    () =>
      certifications.find(
        (item) => String(item.certificationId ?? item.id) === String(certificationId),
      ),
    [certifications, certificationId],
  )

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-muted/20">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2.5">

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Question bank
          </p>
          {certificationsLoading ? (
            <Skeleton className="mt-0.5 h-4 w-48 rounded-rb-control" />
          ) : (
            <p className="truncate text-sm font-bold text-foreground">
              {certification?.title ?? "This certification"}
            </p>
          )}
        </div>

      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <QuestionBank certificationId={Number(certificationId)} />
      </div>
    </div>
  )
}
