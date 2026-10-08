import { AlertCircle, TrendingUp, Zap, BookOpen, CheckCircle, Clock } from "@/components/icons"

export const PRIORITY_CONFIG = {
  CRITICAL_PRIORITY: {
    label: '🔴 Critical',
    mastery: 'Lowest mastery',
    bgColor: 'bg-rb-cardinal-wash',
    textColor: 'text-rb-cardinal-lip',
    icon: AlertCircle,
    description: 'Focus here first',
  },
  HIGH_PRIORITY: {
    label: '🟠 High Priority',
    mastery: 'Low mastery',
    bgColor: 'bg-rb-fox-wash',
    textColor: 'text-rb-fox-lip',
    icon: Zap,
    description: 'Important to review',
  },
  MEDIUM_PRIORITY: {
    label: '🟡 Medium',
    mastery: 'Middling mastery',
    bgColor: 'bg-rb-bee-wash',
    textColor: 'text-rb-bee-ink',
    icon: BookOpen,
    description: 'Good to practice',
  },
  LOW_PRIORITY: {
    label: '🔵 Low',
    mastery: 'Good mastery',
    bgColor: 'bg-rb-macaw-wash',
    textColor: 'text-rb-macaw-lip',
    icon: TrendingUp,
    description: 'Optional review',
  },
  STRONG: {
    label: '✅ Mastered',
    mastery: 'Highest mastery',
    bgColor: 'bg-rb-feather-wash',
    textColor: 'text-rb-feather-ink',
    icon: CheckCircle,
    description: 'Nothing to review here',
  },
  ON_TRACK: {
    label: '⭐ On Track',
    bgColor: 'bg-rb-polar',
    textColor: 'text-rb-wolf',
    icon: Clock,
    description: 'Making good progress',
  },
  NOT_ENOUGH_DATA: {
    label: '❓ Insufficient Data',
    bgColor: 'bg-rb-polar',
    textColor: 'text-rb-hare',
    icon: Clock,
    description: 'Take more assessments',
  },
  NEEDS_REASSESSMENT: {
    label: '🔄 Reassess',
    bgColor: 'bg-rb-beetle-wash',
    textColor: 'text-rb-beetle-lip',
    icon: Clock,
    description: 'Assessment expired',
  },
}

export function PriorityTag({ tag, size = 'md', showDescription = false }) {
  if (!tag) return null

  const config = PRIORITY_CONFIG[tag]
  if (!config) return null

  const Icon = config.icon
  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }[size] || 'px-3 py-1.5 text-sm'

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${config.bgColor} ${config.textColor} ${sizeClass} w-fit`}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
      {showDescription && (
        <p className="text-xs text-muted-foreground">{config.description}</p>
      )}
    </div>
  )
}

const SEAL_CONFIG = {
  CRITICAL_PRIORITY: { fill: "var(--color-rb-cardinal)", short: "critical" },
  HIGH_PRIORITY: { fill: "var(--color-rb-fox)", short: "high" },
  MEDIUM_PRIORITY: { fill: "var(--color-rb-bee)", short: "medium" },
  LOW_PRIORITY: { fill: "var(--color-rb-macaw)", short: "low" },
  STRONG: { fill: "var(--color-rb-feather)", short: "mastered" },
  ON_TRACK: { fill: "var(--color-rb-macaw)", short: "on track" },
  NOT_ENOUGH_DATA: { fill: "var(--color-rb-hare)", short: "no data" },
  NEEDS_REASSESSMENT: { fill: "var(--color-rb-beetle)", short: "reassess" },

  HIGHEST_PRIORITY: { fill: "var(--color-rb-cardinal)", short: "highest" },
  REPEATED_MISTAKE: { fill: "var(--color-rb-fox)", short: "missed" },
  UNASSESSED: { fill: "var(--color-rb-hare)", short: "new" },
}

export function PriorityBookmark({ tag, masteryProbability, size = 16 }) {
  if (!tag) return null

  const config = SEAL_CONFIG[tag]
  if (!config) return null

  const mastery =
    typeof masteryProbability === "number" && Number.isFinite(masteryProbability)
      ? ` — ${Math.round(masteryProbability * 100)}% mastered`
      : ""

  const label = ["mastered", "on track", "no data"].includes(config.short)
    ? config.short
    : `${config.short} priority`

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size * 1.25}
      className="shrink-0"
      role="img"
      aria-label={`${label}${mastery}`}
    >
      <title>{`${label}${mastery}`}</title>
      <path
        d="M5 2h14a1 1 0 0 1 1 1v19l-8-5.2L4 22V3a1 1 0 0 1 1-1z"
        fill={config.fill}
      />
    </svg>
  )
}

export function PriorityChip({ tag, masteryProbability }) {
  if (!tag) return null

  const config = PRIORITY_CONFIG[tag]
  const seal = SEAL_CONFIG[tag]
  if (!config || !seal) return null

  const words = config.label.replace(/^[^\p{L}]+/u, "")

  return (
    <span
      className={`rb-chip ${config.bgColor} ${config.textColor}`}
      title={config.mastery ? `${words} — ${config.mastery}` : words}
    >
      <PriorityBookmark tag={tag} masteryProbability={masteryProbability} size={11} />
      {words}
    </span>
  )
}

const SEAL_OUTLINE = (() => {
  const spikes = 20
  const outerR = 48
  const innerR = 41
  const cx = 50
  const cy = 50
  const points = []

  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI * i) / spikes
    const x = cx + r * Math.sin(angle)
    const y = cy - r * Math.cos(angle)
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }

  return points.join(" ")
})()

export function PrioritySeal({ tag, size = 56 }) {
  if (!tag) return null

  const config = SEAL_CONFIG[tag]
  if (!config) return null

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="shrink-0"
      role="img"
      aria-label={`${config.short} priority`}
    >
      <polygon points={SEAL_OUTLINE} fill={config.fill} />
      <rect x="0" y="42" width="100" height="16" fill="white" />
      <text
        x="50"
        y="53.5"
        textAnchor="middle"
        fontSize={config.short.length > 7 ? "10" : "13"}
        fontWeight="800"
        letterSpacing="0.5"
        fill={config.fill}
        style={{ textTransform: "uppercase", fontFamily: "inherit" }}
      >
        {config.short}
      </text>
    </svg>
  )
}

export function PriorityBadge({ tag, masteryPercentage }) {
  if (!tag) return null

  const config = PRIORITY_CONFIG[tag]
  if (!config) return null

  return (
    <div className={`rounded-md ${config.bgColor} ${config.textColor} px-2 py-1.5`}>
      <p className="text-xs font-semibold">{config.label}</p>
      {masteryPercentage !== undefined && (
        <p className="text-xs opacity-75">
          {Math.round(masteryPercentage * 100)}% mastered
        </p>
      )}
    </div>
  )
}
