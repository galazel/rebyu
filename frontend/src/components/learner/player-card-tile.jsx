import { useQuery } from "@tanstack/react-query"
import { Flame } from "@/components/icons"

import { BentoTile } from "@/components/commons/bento.jsx"
import { base } from "@/services/base"

/**
 * The learner's daily streak, on the board.
 *
 * Modelled on the streak cards games ship: a dark panel, the run in big
 * numerals beside what it takes to keep it, and the week drawn as seven days
 * you either kept or did not. These numbers were previously two small counters
 * in the controls row beside the certification picker, where they read as page
 * furniture -- the same weight as the "Updating" spinner -- when they are the
 * one thing on this board about the learner rather than the syllabus.
 *
 * COLOURS ARE WRITTEN OUT, not taken from the `rb-` tokens. This tile is the
 * only dark surface on a light board, and the portal's classroom layer restyles
 * `[class*="rounded-rb-card"]` surfaces after the utilities land -- the first
 * version of this tile asked for `tone="ink"` and rendered as a white card
 * carrying white numerals, i.e. blank. An inline background and plain `white`
 * cannot be undone by a later rule.
 *
 * Every number is one the server keeps: the streak and its record come from
 * `streaks/me`, the XP from the portal payload the shell already holds. The
 * only derived figure is "next goal", which is a target to aim at rather than
 * anything REBYU awards -- there are no levels or XP tiers in this product, and
 * a progress bar to an invented one would be the single thing here a learner
 * could not act on.
 */

/* The classroom theme's own deep surface and its orange, written out rather
   than read through `--color-rb-*`: those invert under `.dark`, and a tile
   that is dark BY DESIGN must not flip to a pale ground while its type stays
   white. These are the light-theme values of `--color-rb-ink` and
   `--color-rb-fox` from rebyu-classroom.css, so the panel is the same green
   family as the portal header rather than a near-black of its own. */
const PANEL = "#2f4a3c"
const PANEL_LIP = "#243b2f"
const FLAME = "#e08a2c"

/** The next round number worth chasing, above the run they are on. */
const GOALS = [3, 7, 14, 30, 60, 100, 180, 365]

function nextGoal(streak) {
  return GOALS.find((goal) => goal > streak) ?? null
}

/** Whole hours left in the learner's day, for the "keep it today" countdown. */
function hoursLeftToday() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((midnight - now) / 3_600_000))
}

/** The last seven days, most recent last, each flagged if the streak covers it. */
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

    /* Lit when the day falls inside the run the server is counting: a streak is
       `currentStreak` consecutive days ending on the last activity, so the
       window is derivable exactly rather than guessed at. Nothing is lit
       without a last-activity date -- a learner who has never studied should
       see an empty week, not a week of maybes. */
    const gap = last ? Math.round((last - day) / 86_400_000) : null

    return {
      key: day.toISOString().slice(0, 10),
      // The locale decides the short weekday: a hard-coded Mon-Sun is an
      // English week, and it also fixes which day the week starts on.
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      kept: gap != null && gap >= 0 && gap < currentStreak,
      isToday: offset === 6,
    }
  })
}

/** One figure: the number, then what it counts. */
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
    // A missing streak row is the normal state for a learner who has not
    // studied yet, not an error worth retrying against the API.
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
      {/* One wrapping row, so the tile reads as a band when it is wide and
          short (the shipped spot) and stacks into a card when it is narrow and
          tall (where a learner may drag it). `content-evenly` spreads the
          wrapped lines down the full height rather than leaving the bottom
          half of a tall tile empty. */}
      <div className="flex h-full flex-wrap content-evenly items-center justify-between gap-x-6 gap-y-3">
        {/* ------------------------------------------------------- the title */}
        <div className="flex min-w-0 grow basis-[210px] items-center gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-2xl"
            style={{ backgroundColor: "rgba(224,138,44,0.20)" }}
            aria-hidden="true"
          >
            {/* The flame breathes only while the run is alive. On a broken
                streak a pulsing flame is celebrating nothing. */}
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

        {/* ------------------------------------------------------ the figures */}
        <div className="flex grow basis-[290px] items-stretch gap-2">
          <Stat value={streak} label="current" ink={streak > 0 ? FLAME : "white"} />
          <Stat value={keptToday ? "done" : `${hoursLeftToday()}h left`} label="today" />
          <Stat value={goal ?? "-"} label="next goal" />
          <Stat value={xp.toLocaleString()} label="total xp" />
        </div>

        {/* --------------------------------------------------------- the week
            The one thing a bare number cannot show: a run about to break. */}
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

        {/* Personal record. A streak is only worth keeping against something. */}
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
