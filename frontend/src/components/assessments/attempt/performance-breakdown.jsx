import { TrendingUpIcon } from "@/components/icons"

import { Chip, ProgressBar, RebyuCard } from "@/components/rebyu/rebyu-ui.jsx"

const PASS_THRESHOLD = 70

function toneFor(percentage, pending) {
  if (pending) return "fox"
  if (percentage >= PASS_THRESHOLD) return "leaf"
  if (percentage >= PASS_THRESHOLD / 2) return "fox"
  return "cardinal"
}

export default function PerformanceBreakdown({ lessonBreakdown }) {
  const list = Array.isArray(lessonBreakdown) ? lessonBreakdown : []
  if (list.length === 0) return null

  const sorted = [...list].sort(
    (a, b) => Number(a.percentage ?? 0) - Number(b.percentage ?? 0)
  )
  const strengths = sorted.filter(
    (lesson) =>
      (lesson.pendingCount ?? 0) === 0 &&
      Number(lesson.percentage ?? 0) >= PASS_THRESHOLD
  )

  return (
    <section className="space-y-4">
      <h2 className="rb-display rb-display-sm">Performance by lesson</h2>

      <RebyuCard className="space-y-4 p-5">
        {sorted.map((lesson) => {
          const pct = Number(lesson.percentage ?? 0)
          const pending = (lesson.pendingCount ?? 0) > 0
          return (
            <div key={lesson.lessonId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-bold text-rb-eel">
                  {lesson.lessonTitle}
                </span>
                <span className="rb-numeric shrink-0 text-xs text-rb-wolf">
                  {Number(lesson.correctCount ?? 0)}/{Number(lesson.itemCount ?? 0)} right ·{" "}
                  {pct.toFixed(0)}%{pending ? " · pending" : ""}
                </span>
              </div>
              <ProgressBar
                value={pct}
                tone={toneFor(pct, pending)}
                label={`${lesson.lessonTitle} score`}
              />
            </div>
          )
        })}
      </RebyuCard>

      {strengths.length > 0 ? (
        <RebyuCard className="p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-rb-eel">
            <TrendingUpIcon className="size-4 text-rb-leaf" aria-hidden="true" />
            Strengths
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {strengths.map((lesson) => (
              <li
                key={lesson.lessonId}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 truncate text-rb-eel">
                  {lesson.lessonTitle}
                </span>
                <Chip tone="feather">
                  {Number(lesson.percentage).toFixed(0)}%
                </Chip>
              </li>
            ))}
          </ul>
        </RebyuCard>
      ) : null}
    </section>
  )
}
