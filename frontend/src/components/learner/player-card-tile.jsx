import { useQuery } from "@tanstack/react-query"
import { Flame } from "@/components/icons"

import { BentoTile } from "@/components/commons/bento.jsx"
import { base } from "@/services/base"


const PANEL = "#2f4a3c"
const PANEL_LIP = "#243b2f"
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

function Stat({ value, label, ink = "white" }) {
  return (
    <div
      className="flex min-w-0 grow basis-[64px] flex-col items-center justify-center rounded-xl px-2 py-2"
      style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
    >
      <span
        className="font-rb-display text-2xl font-black leading-none tabular-nums"
        style={{ color: ink }}
      >
        {value}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
        {label}
      </span>
    </div>
  )
}

export function PlayerCardTile({ portalData }) {
  const streakQuery = useQuery({
    queryKey: ["learner-streak"],
    queryFn: () => base("streaks/me"),
    staleTime: 60_000,
    retry: false,
  })

  const streak = Number(streakQuery.data?.currentStreak) || 0
  const best = Number(streakQuery.data?.bestStreak) || 0
  const week = recentWeek({
    currentStreak: streak,
    lastActivityDate: streakQuery.data?.lastActivityDate ?? null,
  })
  const keptToday = week[6]?.kept ?? false
  const goal = nextGoal(streak)
  const xp = Number(portalData?.totalXp) || 0

  return (
    <BentoTile
      col={6}
      row={1}
      className="justify-center border-transparent"
      style={{ backgroundColor: PANEL }}
      aria-label="Your daily streak"
    >
      <div className="flex h-full flex-wrap content-evenly items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 grow basis-[210px] items-center gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-2xl"
            style={{ backgroundColor: "rgba(224,138,44,0.20)" }}
            aria-hidden="true"
          >
            <Flame
              className={`size-6 ${streak > 0 ? "rb-flicker" : "opacity-40"}`}
              style={{ color: FLAME }}
            />
          </span>

          <div className="min-w-0">
            <p className="font-rb-display text-lg font-extrabold lowercase leading-none text-white">
              daily streak
            </p>
            <p className="mt-1.5 max-w-[34ch] text-[11px] font-semibold leading-snug text-white/50">
              {streak === 0
                ? "Study today to start one - every day you keep it earns XP."
                : keptToday
                  ? "Counted today. The longer it runs, the more XP you earn."
                  : "Study today to keep it alive - the run resets at midnight."}
            </p>
          </div>
        </div>

        <div className="flex grow basis-[290px] items-stretch gap-2">
          <Stat value={streak} label="current" ink={streak > 0 ? FLAME : "white"} />
          <Stat value={keptToday ? "done" : `${hoursLeftToday()}h left`} label="today" />
          <Stat value={goal ?? "-"} label="next goal" />
          <Stat value={xp.toLocaleString()} label="total xp" />
        </div>

        <div className="flex grow basis-[230px] items-end justify-between gap-1">
          {week.map((day) => (
            <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <Flame
                className="size-5"
                style={{ color: day.kept ? FLAME : "rgba(255,255,255,0.18)" }}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] font-bold uppercase leading-none ${
                  day.isToday ? "text-white" : "text-white/40"
                }`}
                style={day.kept ? { color: FLAME } : undefined}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>

        {best > 0 ? (
          <span
            className="shrink-0 rounded-rb-pill px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/60"
            style={{ backgroundColor: PANEL_LIP }}
          >
            best {best}
          </span>
        ) : null}
      </div>
    </BentoTile>
  )
}
