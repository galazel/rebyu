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
      className="flex flex-col justify-between !p-5 sm:!p-6 gap-3.5"
      aria-label="Your daily streak"
    >
      <BentoHeading
        icon={Flame}
        kicker="Daily Streak"
        title={status}
      />

      <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <StreakFlame lit={streak > 0} />
          <div>
            <div className="flex items-baseline gap-1.5 leading-none">
              <CountUp
                value={streak}
                className="font-rb-display text-3xl sm:text-4xl font-black tabular-nums tracking-tight leading-none"
                style={{ color: streak > 0 ? FLAME : "var(--muted-foreground)" }}
              />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                day{streak === 1 ? "" : "s"}
              </span>
            </div>
            <span className="mt-1 block text-[11px] font-semibold text-muted-foreground">
              {streak > 0 ? "Current streak" : "Start your streak"}
            </span>
          </div>
        </div>
        {best > 0 ? (
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Best streak</span>
            <p className="mt-0.5 font-rb-display text-lg sm:text-xl font-black text-foreground tabular-nums leading-none">
              {best} <span className="text-[11px] font-bold text-muted-foreground">d</span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Last 7 days
        </p>
        <div className="grid w-full grid-cols-7 gap-1.5" aria-label="Last 7 days">
          {week.map((day, index) => (
            <motion.div
              key={day.key}
              className="flex flex-col items-center gap-1"
              title={`${day.label}${day.kept ? " · studied" : ""}`}
              initial={{ opacity: 0, y: 6, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05, type: "spring", stiffness: 400, damping: 20 }}
            >
              <span
                className={`relative grid size-8 sm:size-9 place-items-center rounded-xl transition-all ${
                  day.kept
                    ? "text-white shadow-sm ring-1 ring-amber-500/30"
                    : "bg-muted/60 text-muted-foreground/40 border border-border/40"
                }`}
                style={day.kept ? { background: `linear-gradient(145deg, #f6b34a, ${FLAME} 60%, #d0582a)` } : undefined}
              >
                <Flame className="size-4" aria-hidden="true" />
                {day.isToday ? (
                  <motion.span
                    className="absolute inset-0 rounded-xl ring-2"
                    style={{ "--tw-ring-color": day.kept ? FLAME : "var(--primary)" }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.9, 0, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              <span
                className={`text-[10px] font-bold uppercase leading-none ${
                  day.isToday ? "text-foreground font-black" : "text-muted-foreground"
                }`}
              >
                {day.label.slice(0, 2)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {goal ? (
        <div className="space-y-1.5 rounded-xl border border-border/40 bg-muted/20 p-2.5 sm:p-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Next streak goal</span>
            <span className="font-bold tabular-nums text-foreground">{goal} days</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #f6b34a, ${FLAME})` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (streak / goal) * 100)}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {goal - streak} more day{goal - streak === 1 ? "" : "s"} to your {goal}-day goal
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs font-semibold text-muted-foreground">
        <span>
          Target: <strong className="text-foreground">{goal ?? "Max"}</strong>
        </span>
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
      </div>
    </BentoTile>
  )
}
