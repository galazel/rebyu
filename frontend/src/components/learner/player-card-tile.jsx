import { useQuery } from "@tanstack/react-query"
import { Flame } from "@/components/icons"

import { BentoHeading, BentoTile } from "@/components/commons/bento.jsx"
import { base } from "@/services/base"


const FLAME = "#e08a2c"

const GOALS = [3, 7, 14, 30, 60, 100, 180, 365]

function nextGoal(streak) {
  return GOALS.find((goal) => goal > streak) ?? null
}

function hoursLeftToday() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((midnight - now) / 3_600_000))
}

function recentWeek({ currentStreak, lastActivityDate }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const parsed = lastActivityDate
    ? new Date(`${String(lastActivityDate).slice(0, 10)}T00:00:00`)
    : null
  const last = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null

  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - offset))

    const gap = last ? Math.round((last - day) / 86_400_000) : null

    return {
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      kept: gap != null && gap >= 0 && gap < currentStreak,
      isToday: offset === 6,
    }
  })
}

export function PlayerCardTile({ portalData }) {
  const streakQuery = useQuery({
    queryKey: ["learner-streak"],
    queryFn: () => base("streaks/me"),
    staleTime: 60_000,
    retry: false,
  })
  const levelQuery = useQuery({
    queryKey: ["learner-review-level"],
    queryFn: () => base("learners/me/review-level"),
    staleTime: 60_000,
  })

  const streak = Number(streakQuery.data?.currentStreak) || 0
  const best = Number(streakQuery.data?.bestStreak) || 0
  const week = recentWeek({
    currentStreak: streak,
    lastActivityDate: streakQuery.data?.lastActivityDate ?? null,
  })
  const keptToday = week[6]?.kept ?? false
  const goal = nextGoal(streak)
  const xp = Number(levelQuery.data?.xp ?? portalData?.totalXp) || 0
  const level = levelQuery.data

  const status =
    streak === 0
      ? "Study today to start a streak."
      : keptToday
        ? "Counted today — come back tomorrow."
        : `Study within ${hoursLeftToday()}h to keep it.`

  return (
    <BentoTile col={2} row={1} className="gap-2" aria-label="Your daily streak">
      <BentoHeading
        icon={Flame}
        kicker="Daily Streak"
        title={status}
        chip={
          best > 0 ? (
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              best {best}
            </span>
          ) : null
        }
      />

      <div className="flex items-end justify-between gap-3">
        <p className="leading-none">
          <span
            className="font-rb-display text-4xl font-black tabular-nums"
            style={{ color: streak > 0 ? FLAME : undefined }}
          >
            {streak}
          </span>
          <span className="ml-1 text-xs font-bold text-muted-foreground">
            day{streak === 1 ? "" : "s"}
          </span>
        </p>

        <div className="flex items-end gap-1.5" aria-label="Last 7 days">
          {week.map((day) => (
            <div key={day.key} className="flex flex-col items-center gap-0.5" title={day.label}>
              <Flame
                className="size-3.5"
                style={{ color: day.kept ? FLAME : "var(--color-rb-swan, #e5e5e5)" }}
                aria-hidden="true"
              />
              <span
                className={`text-[9px] font-bold uppercase leading-none ${
                  day.isToday ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {day.label.slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-auto flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold text-muted-foreground">
        <span>Next goal <strong className="text-foreground">{goal ?? "—"}</strong></span>
        <span>
          {level ? (
            <>
              <strong className="text-foreground">Lv. {level.levelNumber}</strong> {level.title}
            </>
          ) : (
            <>
              <strong className="text-foreground">{xp.toLocaleString()}</strong> XP
            </>
          )}
        </span>
      </p>
    </BentoTile>
  )
}
