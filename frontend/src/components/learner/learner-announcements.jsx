import { useQuery } from "@tanstack/react-query"
import { MegaphoneIcon, PinIcon } from "@/components/icons"

import { getMyAnnouncements } from "@/services/institutionService.js"

function formatWhen(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function LearnerAnnouncements({ certificationId }) {
  const query = useQuery({
    queryKey: ["learner-announcements", certificationId ?? "all"],
    queryFn: () => getMyAnnouncements(certificationId),
    enabled: certificationId == null || Number.isFinite(Number(certificationId)),
    staleTime: 60_000,
    retry: 1,
  })

  const announcements = Array.isArray(query.data) ? query.data : []

  if (query.isLoading || query.isError || announcements.length === 0) {
    return null
  }

  return (
    <section className="tg-cat-explain space-y-3" aria-labelledby="course-announcements">
      <div>
        <h2 id="course-announcements" className="flex items-center gap-2.5 text-lg font-bold text-foreground">
          <span className="tg-badge-icon !size-8 !rounded-lg"><MegaphoneIcon className="size-4" aria-hidden="true" /></span>
          Announcements
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Updates from your instructor for this course.
        </p>
      </div>

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <article
            key={announcement.departmentAnnouncementId}
            className={`rounded-[1rem] border p-4 ${
              announcement.pinned ? "border-[var(--tg)] bg-[var(--tg-softer)]" : "border-[var(--tg-line)] bg-card"
            }`}
          >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 font-semibold text-foreground">{announcement.title}</h3>
                {announcement.pinned ? (
                  <span className="tg-chip inline-flex shrink-0 items-center gap-1">
                    <PinIcon className="size-3" aria-hidden="true" />
                    Pinned
                  </span>
                ) : null}
              </div>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {announcement.body}
              </p>

              <p className="mt-3 text-xs text-muted-foreground">
                {announcement.authorName}
                {announcement.departmentName ? ` · ${announcement.departmentName}` : ""}
                {announcement.createdAt ? ` · ${formatWhen(announcement.createdAt)}` : ""}
              </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default LearnerAnnouncements
