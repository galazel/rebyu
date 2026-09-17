import { useQuery } from "@tanstack/react-query"
import { Flame, Zap } from "@/components/icons"

import { base } from "@/services/base"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * The learner's gamification counters, on the analytics board.
 *
 * Two numbers only: the streak they do not want to break, and the XP they are
 * accumulating.
 *
 * Each counter is an icon *and* a number. The icon is what makes them scannable,
 * and each keeps a text label in its tooltip and its accessible name, so the
 * icon is never the only carrier.
 *
 * XP comes from the portal payload the layout has already fetched, so it costs
 * no extra request. Only the streak needs its own call.
 */

const TONES = {
  flame: "text-rb-fox",
  xp: "text-rb-macaw-lip",
}

function Counter({ icon: Icon, tone, value, label, hint }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A span, not a button: these are readouts, and giving them a
            button's affordance promised an action none of them perform. */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-bold tabular-nums"
          aria-label={`${label}: ${value}`}
        >
          {/* No flame animation here: `rb-flicker` is scoped to `.rebyu-ds`,
              which the portal header does not sit inside, and opting this strip
              into that layer would drag its type and colour rules in with it. */}
          <Icon className={`size-4 shrink-0 ${TONES[tone] ?? ""}`} aria-hidden="true" />
          <span>{value}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{hint ?? label}</TooltipContent>
    </Tooltip>
  )
}

export function LearnerStatusStrip({ portalData, className }) {
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
  const xp = Number(portalData?.totalXp) || 0

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label="Your progress">
      <Counter
        icon={Flame}
        tone="flame"
        value={streak}
        label="Day streak"
        hint={best > 0 ? `${streak}-day streak · best ${best}` : "Day streak"}
      />
      <Counter icon={Zap} tone="xp" value={xp.toLocaleString()} label="Total XP" hint="Total XP earned" />
    </div>
  )
}
