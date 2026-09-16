import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import {
  ArrowRight,
  ChevronDown,
  ClipboardCheck,
  Clock,
  MegaphoneIcon,
  PinIcon,
  UsersRound,
} from "@/components/icons"
import { returnState } from "@/lib/assessment-return"
import { cn } from "@/lib/utils"
import { getMyClasses } from "@/services/learnerService.js"

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function useMyClasses(certificationId) {
  const query = useQuery({
    queryKey: ["learner-classes", String(certificationId)],
    queryFn: () => getMyClasses(certificationId),
    enabled: certificationId != null,
    staleTime: 60_000,
    retry: 1,
  })
  return Array.isArray(query.data) ? query.data : []
}

function ClassHeader({ group }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rb-macaw-wash text-rb-macaw-lip">
        <UsersRound className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-rb-hare">
          Your class{group.institutionName ? ` · ${group.institutionName}` : ""}
        </span>
        <span className="block truncate font-rb-display text-base font-extrabold text-rb-eel">
          {group.groupName}
        </span>
      </span>
    </div>
  )
}

function ClassBody({ group }) {
  const location = useLocation()
  const [showAll, setShowAll] = useState(false)
  const announcements = group.announcements ?? []
  const visible = showAll ? announcements : announcements.slice(0, 2)
  const assessments = group.assessments ?? []

  return (
    <div className="space-y-4">
      {group.groupDescription ? (
        <p className="text-sm leading-5 text-rb-wolf">{group.groupDescription}</p>
      ) : null}

      <div>
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rb-hare">
          <MegaphoneIcon className="size-3.5" aria-hidden="true" />
          Announcements
          {announcements.length > 0 ? (
            <span className="rounded-full bg-rb-macaw-wash px-1.5 text-[10px] text-rb-macaw-lip">
              {announcements.length}
            </span>
          ) : null}
        </h3>
        {announcements.length === 0 ? (
          <p className="mt-2 text-sm text-rb-wolf">Nothing posted yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {visible.map((item) => (
              <li key={item.groupAnnouncementId} className="rounded-xl bg-rb-polar px-3 py-2.5">
                <p className="flex items-start gap-1.5 text-sm font-bold leading-5 text-rb-eel">
                  {item.pinned ? (
                    <PinIcon className="mt-1 size-3 shrink-0 text-rb-macaw-lip" aria-label="Pinned" />
                  ) : null}
                  <span className="min-w-0 flex-1 break-words">{item.title}</span>
                  <span className="shrink-0 pt-0.5 text-[11px] font-medium text-rb-hare">
                    {formatDate(item.createdAt)}
                  </span>
                </p>
                <p className="mt-1 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-5 text-rb-wolf">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        )}
        {announcements.length > 2 ? (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="mt-2 text-xs font-bold text-rb-macaw-lip hover:underline"
          >
            {showAll ? "Show fewer" : `Show all ${announcements.length}`}
          </button>
        ) : null}
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rb-hare">
          <ClipboardCheck className="size-3.5" aria-hidden="true" />
          Class assessments
        </h3>
        {assessments.length === 0 ? (
          <p className="mt-2 text-sm text-rb-wolf">None published yet.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {assessments.map((exam) => (
              <li key={exam.examId}>
                <Link
                  to={`/learner/assessments/${exam.examId}`}
                  state={returnState(location)}
                  className="flex items-center gap-3 rounded-xl bg-rb-polar px-3 py-2.5 transition-colors hover:bg-rb-feather-wash"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-rb-eel">{exam.title}</span>
                    <span className="flex items-center gap-2 text-xs text-rb-wolf">
                      {exam.totalQuestions ? `${exam.totalQuestions} questions` : null}
                      {exam.durationMinutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          {exam.durationMinutes} min
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-rb-hare" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * The learner's class for this certification -- the group an institution
 * invited them into, its announcements and its assessments. Nothing renders for
 * a learner who is not in a class.
 *
 * Two shapes. On wide screens a rail pinned to the left of the road, in the
 * empty margin beside it, so the road still opens the page. Below that a
 * one-line card that expands on tap, so a phone is not pushed a screen down
 * before the first lesson.
 */
export function LearnerClassPanel({ certificationId, variant = "rail" }) {
  const classes = useMyClasses(certificationId)
  const [open, setOpen] = useState(false)
  if (classes.length === 0) return null

  if (variant === "rail") {
    return (
      <aside className="space-y-4" aria-label="Your class">
        {classes.map((group) => (
          <section
            key={group.groupId}
            className="rounded-rb-card border-2 border-rb-swan bg-rb-snow p-4 shadow-[var(--comic-shadow-sm)]"
          >
            <ClassHeader group={group} />
            <div className="mt-4">
              <ClassBody group={group} />
            </div>
          </section>
        ))}
      </aside>
    )
  }

  const unread = classes.reduce((total, group) => total + (group.announcements?.length ?? 0), 0)
  return (
    <div className="space-y-3" aria-label="Your class">
      {classes.map((group, index) => (
        <section key={group.groupId} className="rounded-rb-card border-2 border-rb-swan bg-rb-snow">
          <button
            type="button"
            onClick={() => setOpen((value) => (value === index ? false : index))}
            aria-expanded={open === index}
            className="flex w-full items-center gap-3 p-3.5"
          >
            <span className="min-w-0 flex-1">
              <ClassHeader group={group} />
            </span>
            {index === 0 && unread > 0 && open !== index ? (
              <span className="shrink-0 rounded-full bg-rb-macaw-wash px-2 py-0.5 text-[11px] font-bold text-rb-macaw-lip">
                {unread} new
              </span>
            ) : null}
            <ChevronDown
              className={cn("size-4 shrink-0 text-rb-hare transition-transform", open === index && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          {open === index ? (
            <div className="border-t-2 border-rb-swan p-3.5">
              <ClassBody group={group} />
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}

export default LearnerClassPanel
