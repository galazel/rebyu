import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { animate, motion } from "framer-motion"
import { Flame } from "@/components/icons"

import { BentoHeading, BentoTile } from "@/components/commons/bento.jsx"
import { base } from "@/services/base"


const FLAME = "#e08a2c"

/** A drawn, layered flame that flickers while the streak is alive, and sits grey and
 *  still at zero. Reduced-motion users get it still (MotionConfig in main.jsx). */
function StreakFlame({ lit }) {
  return (
    <motion.div
      className="relative size-12 sm:size-14 shrink-0"
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 14 }}
      aria-hidden="true"
    >
      {lit ? (
        <motion.span
          className="absolute inset-2 rounded-full blur-xl"
          style={{ background: "radial-gradient(circle, #f6b34acc, #e08a2c00 70%)" }}
          animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <motion.svg
        viewBox="0 0 64 80"
        className="relative size-full drop-shadow-sm"
        style={{ originY: 1 }}
        animate={lit ? { scaleY: [1, 1.06, 0.97, 1.04, 1], rotate: [0, -1.5, 1.2, -0.6, 0] } : undefined}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="streak-outer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lit ? "#ffb347" : "#d4d4d4"} />
            <stop offset="0.6" stopColor={lit ? "#f07a1a" : "#bdbdbd"} />
            <stop offset="1" stopColor={lit ? "#d6431f" : "#a3a3a3"} />
          </linearGradient>
          <linearGradient id="streak-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lit ? "#fff3b0" : "#f0f0f0"} />
            <stop offset="1" stopColor={lit ? "#ffc23d" : "#dcdcdc"} />
          </linearGradient>
        </defs>
        <path
          fill="url(#streak-outer)"
          d="M32 2c3 12 14 18 18 30 3 9 4 15 2 23-3 13-13 23-20 23S12 72 10 58c-1-8 1-15 5-21 2 6 5 9 9 10-3-11 0-21 4-29 2-5 4-10 4-16z"
        />
        <motion.path
          fill="url(#streak-inner)"
          d="M33 34c2 8 9 12 10 21 1 9-5 17-11 17s-12-6-11-14c0-5 3-9 6-11 0 4 2 6 4 7-1-7 0-14 2-20z"
          style={{ originY: 1 }}
          animate={lit ? { scaleY: [1, 1.12, 0.94, 1.08, 1], opacity: [1, 0.85, 1, 0.9, 1] } : undefined}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </motion.div>
  )
}

/** The streak number rolls up from 0 when the card appears. */
function CountUp({ value, className, style }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const controls = animate(0, value, {
      duration: Math.min(1.2, 0.4 + value * 0.05),
      ease: "easeOut",
      onUpdate: (latest) => setShown(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value])
  return <span className={className} style={style}>{shown}</span>
}

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
    <BentoTile
      col={2}
      row={1}
      className="gap-1.5 !p-4 sm:!p-5 [&_.rb-bento-heading]:!mb-1.5 [&_.rb-bento-heading]:!pb-2"
      aria-label="Your daily streak"
    >
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

      <div className="flex w-full flex-1 flex-col justify-center gap-2.5">
        <div className="flex items-center justify-center gap-3.5 sm:gap-5">
          <StreakFlame lit={streak > 0} />
          <div className="leading-none">
            <CountUp
              value={streak}
              className="block font-rb-display text-4xl sm:text-[2.75rem] font-black tabular-nums tracking-tight leading-none"
              style={{ color: streak > 0 ? FLAME : "var(--muted-foreground)" }}
            />
            <span className="mt-1 block text-[11px] sm:text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              day{streak === 1 ? "" : "s"} streak
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-7 gap-1" aria-label="Last 7 days">
          {week.map((day, index) => (
            <motion.div
              key={day.key}
              className="flex flex-col items-center gap-1"
              title={`${day.label}${day.kept ? " · studied" : ""}`}
              initial={{ opacity: 0, y: 8, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.06, type: "spring", stiffness: 420, damping: 18 }}
            >
              <span
                className={`relative grid size-7 sm:size-8 place-items-center rounded-full ${
                  day.kept ? "text-white shadow-sm" : "bg-muted text-muted-foreground/50"
                }`}
                style={day.kept ? { background: `linear-gradient(160deg, #f6b34a, ${FLAME} 55%, #d0582a)` } : undefined}
              >
                <Flame className="size-3.5" aria-hidden="true" />
                {day.isToday ? (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-2"
                    style={{ "--tw-ring-color": day.kept ? FLAME : "var(--border)" }}
                    animate={{ scale: [1, 1.22, 1], opacity: [0.9, 0, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase leading-none ${
                  day.isToday ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {day.label.slice(0, 2)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {goal ? (
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #f6b34a, ${FLAME})` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (streak / goal) * 100)}%` }}
              transition={{ delay: 0.3, duration: 0.9, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] font-semibold leading-tight text-muted-foreground">
            {goal - streak} more day{goal - streak === 1 ? "" : "s"} to your {goal}-day goal
          </p>
        </div>
      ) : null}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-border/40 pt-1.5 text-[11px] font-semibold leading-tight text-muted-foreground">
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
