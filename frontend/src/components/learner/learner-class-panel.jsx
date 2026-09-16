import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { ArrowRight, ClipboardCheck, Clock, MegaphoneIcon, PinIcon, UsersRound } from "@/components/icons"
import { returnState } from "@/lib/assessment-return"
import { getMyClasses } from "@/services/learnerService.js"

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

/**
 * The learner's class for this certification: the group an institution invited
 * them into, its announcements, and the assessments its leader published.
 * Renders nothing for a learner who is not in a class.
 */
export function LearnerClassPanel({ certificationId }) {
  const location = useLocation()
  const [showAll, setShowAll] = useState(false)
  const classesQuery = useQuery({
    queryKey: ["learner-classes", String(certificationId)],
    queryFn: () => getMyClasses(certificationId),
    enabled: certificationId != null,
    staleTime: 60_000,
    retry: 1,
  })

  const classes = Array.isArray(classesQuery.data) ? classesQuery.data : []
  if (classes.length === 0) return null

  return (
    <div className="mx-auto mt-6 max-w-[720px] space-y-4 px-4 sm:px-0">
      {classes.map((group) => {
        const announcements = group.announcements ?? []
        const visible = showAll ? announcements : announcements.slice(0, 3)
        const assessments = group.assessments ?? []
        return (
          <section
            key={group.groupId}
            className="rounded-rb-card border-2 border-rb-swan bg-rb-snow p-5"
            aria-label={`Your class ${group.groupName}`}
          >
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rb-macaw-wash text-rb-macaw-lip">
                <UsersRound className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-rb-hare">
                  Your class{group.institutionName ? ` · ${group.institutionName}` : ""}
                </p>
                <p className="font-rb-display text-lg font-extrabold text-rb-eel">{group.groupName}</p>
                {group.groupDescription ? (
                  <p className="mt-0.5 text-sm text-rb-wolf">{group.groupDescription}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-rb-eel">
                <MegaphoneIcon className="size-4" aria-hidden="true" />
                Announcements
              </h3>
              {announcements.length === 0 ? (
                <p className="mt-2 text-sm text-rb-wolf">No announcements from your class yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {visible.map((item) => (
                    <li key={item.groupAnnouncementId} className="rounded-xl border border-rb-swan bg-rb-polar p-3">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-rb-eel">
                        {item.pinned ? <PinIcon className="size-3.5 text-rb-macaw-lip" aria-label="Pinned" /> : null}
                        {item.title}
                        <span className="ml-auto shrink-0 text-xs font-medium text-rb-hare">
                          {formatDate(item.createdAt)}
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-rb-wolf">{item.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              {announcements.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setShowAll((value) => !value)}
                  className="mt-2 text-xs font-bold text-rb-macaw-lip hover:underline"
                >
                  {showAll ? "Show fewer" : `Show all ${announcements.length}`}
                </button>
              ) : null}
            </div>

            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-rb-eel">
                <ClipboardCheck className="size-4" aria-hidden="true" />
                Class assessments
              </h3>
              {assessments.length === 0 ? (
                <p className="mt-2 text-sm text-rb-wolf">Your class hasn't published any assessments yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-rb-swan rounded-xl border border-rb-swan">
                  {assessments.map((exam) => (
                    <li key={exam.examId}>
                      <Link
                        to={`/learner/assessments/${exam.examId}`}
                        state={returnState(location)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-rb-polar"
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
          </section>
        )
      })}
    </div>
  )
}

export default LearnerClassPanel
