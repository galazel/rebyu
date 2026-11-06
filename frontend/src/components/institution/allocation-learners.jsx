import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { HistoryIcon, UsersRound } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExportButton } from "@/components/commons/export-button.jsx"
import { InstitutionErrorState, InstitutionLoadingSkeleton, formatDate } from "@/components/institution/institution-ui.jsx"
import {
  getAllocationLearners,
  getCertificationArchiveLearners,
  getCertificationArchives,
} from "@/services/institutionService.js"

/* One learner record — current or frozen at departure — in every export. */
export const RECORD_COLUMNS = [
  "Learner", "Username", "Email", "Certification", "Department", "Section", "Program",
  "Joined on", "Left on", "Why they left", "Completion (%)", "Lessons finished", "Graded attempts",
  "Passed attempts", "Pass rate (%)", "Average score (%)", "Badge earned", "Badge earned on",
  "Passed mock exam", "Best mock exam score (%)", "Last active",
]

const REASON = { removed: "Removed by the department", expired: "Certification access expired" }

export function recordRow(r) {
  return [
    r.name, r.username, r.email, r.certificationTitle, r.departmentName ?? "No department", r.sectionName ?? "No section",
    r.programName ?? "", r.joinedAt ?? "", r.leftAt ?? "", r.leftReason ? REASON[r.leftReason] ?? r.leftReason : "",
    r.progressPercentage == null ? null : Math.round(Number(r.progressPercentage)), r.lessonsCompleted, r.gradedAttempts,
    r.passedAttempts, r.passRate, r.averageScore, Boolean(r.badgeEarned), r.badgeEarnedAt ?? "",
    Boolean(r.mockExamPassed), r.bestMockExamScore, r.lastActivityAt ?? "Never",
  ]
}

function RecordTable({ rows, showLeft = false }) {
  if (!rows.length) return <p className="py-4 text-center text-xs text-muted-foreground">No learners.</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-xs">
        <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Learner</th>
            <th className="px-2 py-2 text-left">Department / section</th>
            <th className="px-2 py-2 text-left">Joined</th>
            {showLeft ? <th className="px-2 py-2 text-left">Left</th> : null}
            <th className="px-2 py-2 text-right">Completion</th>
            <th className="px-2 py-2 text-right">Avg score</th>
            <th className="px-3 py-2 text-left">Badge</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((r) => (
            <tr key={`${r.learnerId}-${r.leftAt ?? "now"}`}>
              <td className="px-3 py-2">
                <p className="font-semibold text-foreground">{r.name}</p>
                <p className="text-[11px] text-muted-foreground">{r.email ?? (r.username ? `@${r.username}` : "")}</p>
              </td>
              <td className="px-2 py-2 text-muted-foreground">
                {[r.departmentName, r.sectionName].filter(Boolean).join(" · ") || "—"}
              </td>
              <td className="px-2 py-2 text-muted-foreground">{r.joinedAt ? formatDate(r.joinedAt) : "—"}</td>
              {showLeft ? (
                <td className="px-2 py-2 text-muted-foreground">
                  {r.leftAt ? formatDate(r.leftAt) : "—"}
                  {r.leftReason ? <span className="block text-[10px]">{REASON[r.leftReason] ?? r.leftReason}</span> : null}
                </td>
              ) : null}
              <td className="px-2 py-2 text-right tabular-nums">
                {r.progressPercentage == null ? "—" : `${Math.round(Number(r.progressPercentage))}%`}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{r.averageScore == null ? "—" : `${r.averageScore}%`}</td>
              <td className="px-3 py-2">{r.badgeEarned ? <Badge variant="outline" className="text-[10px]">Earned</Badge> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** "Learners" button on a certification card: current and former learners, with an export. */
export function AllocationLearnersButton({ allocation, title }) {
  const [open, setOpen] = useState(false)
  const query = useQuery({
    queryKey: ["allocation-learners", allocation.institutionCertId],
    queryFn: () => getAllocationLearners(allocation.institutionCertId),
    enabled: open,
  })
  const current = query.data?.current ?? []
  const former = query.data?.former ?? []
  const csv = async () => {
    const data = query.data ?? (await getAllocationLearners(allocation.institutionCertId))
    return [
      { title: "Current learners", columns: RECORD_COLUMNS, rows: (data.current ?? []).map(recordRow) },
      { title: "Former learners (removed; figures frozen when they left)", columns: RECORD_COLUMNS, rows: (data.former ?? []).map(recordRow) },
    ]
  }
  const details = [
    ["Certification", title],
    ["Access", `${allocation.accessStartDate ?? "?"} to ${allocation.accessExpiryDate ?? "?"}`],
    ["Seats", `${allocation.usedSlots ?? 0} of ${allocation.totalSlots ?? 0} used`],
  ]
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <UsersRound className="size-4" aria-hidden="true" />
        Learners
      </Button>
      <ExportButton filename="rebyu-certification-learners" report="Certification learners" details={details} sections={csv} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title} — learners</DialogTitle>
            <DialogDescription>
              Everyone your institution has on this certification, and those who left. Former learners' figures are as
              they stood when they left.
            </DialogDescription>
          </DialogHeader>
          {query.isLoading ? (
            <InstitutionLoadingSkeleton rows={3} />
          ) : query.isError ? (
            <InstitutionErrorState title="Unable to load learners" onRetry={query.refetch} />
          ) : (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Current learners ({current.length})</h3>
                <RecordTable rows={current} />
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Former learners ({former.length})</h3>
                <RecordTable rows={former} showLeft />
              </section>
              <div className="flex justify-end">
                <ExportButton filename="rebyu-certification-learners" report="Certification learners" details={details} sections={csv} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Everything on the Certifications page in one file: each certification's term and
 * seats, every current and former learner, and every archived term with its learners.
 */
export async function certificationsPageCsv(allocations, titleOf) {
  const [perAllocation, archives] = await Promise.all([
    Promise.all(allocations.map((a) => getAllocationLearners(a.institutionCertId).catch(() => ({ current: [], former: [] })))),
    getCertificationArchives().catch(() => []),
  ])
  const archiveLearners = await Promise.all(
    (archives ?? []).map((a) => getCertificationArchiveLearners(a.archiveId).catch(() => []))
  )
  return [
    {
      title: "Certifications",
      columns: [
        "Certification", "Status", "Access from", "Access until", "Seats total", "Seats used", "Seats free",
        "Current learners", "Former learners",
      ],
      rows: allocations.map((a, i) => [
        titleOf(a), a.status, a.accessStartDate, a.accessExpiryDate, a.totalSlots ?? 0, a.usedSlots ?? 0,
        Math.max(0, (a.totalSlots ?? 0) - (a.usedSlots ?? 0)),
        perAllocation[i]?.current?.length ?? 0, perAllocation[i]?.former?.length ?? 0,
      ]),
    },
    {
      title: "Current learners (all certifications)",
      columns: RECORD_COLUMNS,
      rows: perAllocation.flatMap((d) => (d?.current ?? []).map(recordRow)),
    },
    {
      title: "Former learners (removed; figures frozen when they left)",
      columns: RECORD_COLUMNS,
      rows: perAllocation.flatMap((d) => (d?.former ?? []).map(recordRow)),
    },
    {
      title: "Archived terms",
      columns: ["Certification", "Access from", "Access until", "Archived on", "Seats total", "Seats used", "Learners"],
      rows: (archives ?? []).map((a) => [
        a.certificationTitle, a.accessStartDate, a.accessExpiryDate, a.archivedAt, a.totalSlots, a.usedSlots, a.learnerCount,
      ]),
    },
    {
      title: "Learners of archived terms (figures frozen when access ended)",
      columns: ["Archived on", ...RECORD_COLUMNS],
      rows: (archives ?? []).flatMap((a, i) => (archiveLearners[i] ?? []).map((r) => [a.archivedAt, ...recordRow(r)])),
    },
  ]
}

/** Finished access terms with their learners as they stood when access ended. */
export function CertificationArchives() {
  const [openId, setOpenId] = useState(null)
  const archivesQuery = useQuery({ queryKey: ["certification-archives"], queryFn: getCertificationArchives })
  const archives = Array.isArray(archivesQuery.data) ? archivesQuery.data : []
  const open = archives.find((a) => a.archiveId === openId) ?? null
  const learnersQuery = useQuery({
    queryKey: ["certification-archive-learners", openId],
    queryFn: () => getCertificationArchiveLearners(openId),
    enabled: openId != null,
  })

  const detailsOf = (a) => [
    ["Certification", a.certificationTitle],
    ["Access", `${a.accessStartDate ?? "?"} to ${a.accessExpiryDate ?? "?"}`],
    ["Archived on", a.archivedAt],
    ["Seats at the end", `${a.usedSlots ?? 0} of ${a.totalSlots ?? 0} used`],
    ["Learners in the term", a.learnerCount],
  ]
  const csvOf = (a) => async () => [
    {
      title: "Term",
      columns: ["Certification", "Access from", "Access until", "Archived on", "Seats total", "Seats used", "Learners", "Reason"],
      rows: [[a.certificationTitle, a.accessStartDate, a.accessExpiryDate, a.archivedAt, a.totalSlots, a.usedSlots, a.learnerCount, a.reason]],
    },
    {
      title: "Learners (figures frozen when access ended)",
      columns: RECORD_COLUMNS,
      rows: (await getCertificationArchiveLearners(a.archiveId)).map(recordRow),
    },
  ]

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-2">
        <div>
          <h2 className="flex items-center gap-2 font-rb-display text-lg font-bold">
            <HistoryIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            Archived terms
          </h2>
          <p className="text-xs text-muted-foreground">
            When a certification's access expires, its term is archived here and its learners leave the institution — they
            keep their own enrolment. Their records are kept for export.
          </p>
        </div>
      </div>
      {archivesQuery.isLoading ? (
        <InstitutionLoadingSkeleton rows={2} />
      ) : archivesQuery.isError ? (
        <InstitutionErrorState title="Unable to load archives" onRetry={archivesQuery.refetch} />
      ) : archives.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
          No archived terms yet. A certification is archived automatically the day after its access ends.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {archives.map((a) => (
            <li key={a.archiveId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{a.certificationTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Access {formatDate(a.accessStartDate)} – {formatDate(a.accessExpiryDate)} · archived {formatDate(a.archivedAt)} ·{" "}
                  {a.learnerCount} learner{a.learnerCount === 1 ? "" : "s"} · {a.usedSlots ?? 0}/{a.totalSlots ?? 0} seats used
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => setOpenId(a.archiveId)}>
                  <UsersRound className="size-4" aria-hidden="true" />
                  Learners
                </Button>
                <ExportButton filename="rebyu-archived-term" report="Archived certification term" details={detailsOf(a)} sections={csvOf(a)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open != null} onOpenChange={(value) => !value && setOpenId(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{open?.certificationTitle} — archived term</DialogTitle>
            <DialogDescription>
              Access {formatDate(open?.accessStartDate)} – {formatDate(open?.accessExpiryDate)}. Figures are as they stood when
              access ended.
            </DialogDescription>
          </DialogHeader>
          {learnersQuery.isLoading ? (
            <InstitutionLoadingSkeleton rows={3} />
          ) : (
            <RecordTable rows={Array.isArray(learnersQuery.data) ? learnersQuery.data : []} showLeft />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
