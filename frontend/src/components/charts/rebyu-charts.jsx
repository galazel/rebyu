import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"


const LIGHT = {
  series: ["#2f6b4f", "#c9962b", "#c8553d", "#8b5f7d"],
  other: "#AFAFAF",
  danger: "#FF4B4B",
  success: "#3F8F02",
  statusInk: { weak: "#C62828", developing: "#8A4F00", strong: "#33660A" },
  ink: { primary: "#4B4B4B", secondary: "#777777", muted: "#AFAFAF" },
  grid: "#E5E5E5",
  surface: "#FFFFFF",
  track: "#F1F1F1",
}

const DARK = {
  series: ["#3B82F6", "#00A896", "#D4761B", "#A96BE0"],
  other: "#6B6B6B",
  danger: "#D62C2C",
  success: "#5CA82F",
  statusInk: { weak: "#FF8A8A", developing: "#FFB35C", strong: "#8ED14F" },
  ink: { primary: "#E8E8E8", secondary: "#A8A8A8", muted: "#7A7A7A" },
  grid: "#3A3A3A",
  surface: "#242424",
  track: "#333333",
}

export function useChartTheme() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  )

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains("dark"))
    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return isDark ? DARK : LIGHT
}

export function seriesColor(theme, index) {
  return index < theme.series.length ? theme.series[index] : theme.other
}

export const MASTERY_BANDS = { weak: 25, developing: 50 }

export function masteryBand(value) {
  if (value == null) {
    return null
  }
  const score = Number(value)
  if (!Number.isFinite(score)) {
    return null
  }
  if (score < MASTERY_BANDS.weak) {
    return "weak"
  }
  if (score < MASTERY_BANDS.developing) {
    return "developing"
  }
  return "strong"
}

export function masteryColor(theme, value) {
  switch (masteryBand(value)) {
    case "weak":
      return theme.danger
    case "developing":
      return seriesColor(theme, 2)
    case "strong":
      return theme.success
    default:
      return theme.ink.muted
  }
}

export function masteryInk(theme, value) {
  const band = masteryBand(value)
  return band ? theme.statusInk[band] : theme.ink.secondary
}

export const READINESS_BANDS = { developing: 50, nearlyReady: 70, examReady: 85 }

const READINESS_META = {
  needs_review: { label: "needs review", hint: "Plenty still to cover before exam day." },
  developing: { label: "developing", hint: "The foundations are forming. Keep going." },
  nearly_ready: { label: "nearly ready", hint: "Close. Tighten your weakest topics." },
  exam_ready: { label: "exam ready", hint: "You are scoring at exam standard." },
}

export function readinessBand(value) {
  if (value == null) {
    return null
  }
  const score = Number(value)
  if (!Number.isFinite(score)) {
    return null
  }
  if (score >= READINESS_BANDS.examReady) {
    return "exam_ready"
  }
  if (score >= READINESS_BANDS.nearlyReady) {
    return "nearly_ready"
  }
  if (score >= READINESS_BANDS.developing) {
    return "developing"
  }
  return "needs_review"
}

export function readinessMeta(value) {
  return READINESS_META[readinessBand(value)] ?? null
}

export function readinessColor(theme, value) {
  switch (readinessBand(value)) {
    case "needs_review":
      return theme.danger
    case "developing":
      return seriesColor(theme, 2)
    case "nearly_ready":
      return seriesColor(theme, 0)
    case "exam_ready":
      return theme.success
    default:
      return theme.ink.muted
  }
}

export function readinessInk(theme, value) {
  switch (readinessBand(value)) {
    case "needs_review":
      return theme.statusInk.weak
    case "developing":
      return theme.statusInk.developing
    case "nearly_ready":
      return seriesColor(theme, 0)
    case "exam_ready":
      return theme.statusInk.strong
    default:
      return theme.ink.secondary
  }
}


export function ChartPanel({
  title,
  subtitle,
  sample = false,
  action,
  footnote,
  className = "",
  children,
}) {
  return (
    <section
      className={`flex min-w-0 flex-col rounded-rb-card border-2 border-border bg-card p-4 sm:p-5 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-rb-display text-sm font-extrabold lowercase text-foreground">
              {title}
            </h3>
            {sample ? <SampleChip /> : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ?? null}
      </div>

      <div className="mt-4 min-w-0 flex-1">{children}</div>

      {footnote ? (
        <p className="mt-3 border-t-2 border-border pt-3 text-xs text-muted-foreground">
          {footnote}
        </p>
      ) : null}
    </section>
  )
}

export function SampleChip({ label = "sample data" }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-rb-fox-wash px-2 py-0.5 font-rb-display text-[0.625rem] font-extrabold lowercase tracking-wide text-rb-fox-lip">
      {label}
    </span>
  )
}

export function ChartLegend({ items, note }) {
  return (
    <div className="mt-4">
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item) => (
          <li key={item.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            <span className="font-semibold text-muted-foreground">{item.name}</span>
            <span className="font-bold tabular-nums text-foreground">{item.value}</span>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  )
}

function TooltipCard({ active, payload, label, suffix = "", prefix = "" }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border-2 border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      {label ? <div className="text-xs font-bold text-muted-foreground">{label}</div> : null}
      <ul className="mt-1 space-y-0.5">
        {payload.map((entry) => (
          <li key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: entry.color ?? entry.payload?.fill }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-bold tabular-nums">
              {prefix}
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChartEmpty({ message = "No data to plot yet." }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-rb-tile border-2 border-dashed border-border px-4 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

function axisProps(theme) {
  return {
    stroke: theme.grid,
    tick: { fill: theme.ink.secondary, fontSize: 11, fontWeight: 600 },
    tickLine: false,
  }
}


export function TrendLineChart({
  data,
  xKey,
  series,
  height = 260,
  unit = "",
  domain = [0, 100],
  ticks,
  legendNote,
  showLegend = true,
  dot = true,
}) {
  const theme = useChartTheme()
  if (!data?.length) return <ChartEmpty />

  const last = data[data.length - 1]

  return (
    <figure className="w-full min-w-0">
      <div style={{ height }} className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />
            <XAxis dataKey={xKey} {...axisProps(theme)} />
            <YAxis domain={domain} ticks={ticks} unit={unit} {...axisProps(theme)} />
            <Tooltip
              content={<TooltipCard suffix={unit} />}
              cursor={{ stroke: theme.grid, strokeWidth: 1 }}
            />
            {showLegend && series.length > 1 ? (
              <Legend
                wrapperStyle={{ fontSize: 12, fontWeight: 700, color: theme.ink.secondary }}
                iconType="plainline"
              />
            ) : null}

            {series.map((entry, index) => {
              const color = entry.color ?? seriesColor(theme, index)
              return (
                <Line
                  key={entry.key}
                  type="monotone"
                  dataKey={entry.key}
                  name={entry.name}
                  stroke={color}
                  strokeWidth={2}
                  dot={dot ? { r: 4, fill: color, stroke: theme.surface, strokeWidth: 2 } : false}
                  activeDot={{ r: 6, stroke: theme.surface, strokeWidth: 2 }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showLegend ? (
        <ChartLegend
          items={series.map((entry, index) => ({
            name: entry.name,
            value: `${last?.[entry.key] ?? "—"}${unit}`,
            color: entry.color ?? seriesColor(theme, index),
          }))}
          note={legendNote ?? "Latest value in the period"}
        />
      ) : null}
    </figure>
  )
}


export function TrendAreaChart({
  data,
  xKey,
  series,
  height = 240,
  unit = "",
  stacked = true,
  legendNote,
}) {
  const theme = useChartTheme()
  if (!data?.length) return <ChartEmpty />

  const last = data[data.length - 1]

  return (
    <figure className="w-full min-w-0">
      <div style={{ height }} className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <defs>
              {series.map((entry, index) => (
                <linearGradient
                  key={entry.key}
                  id={`rb-area-${entry.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={seriesColor(theme, index)} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={seriesColor(theme, index)} stopOpacity={0.04} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />
            <XAxis dataKey={xKey} {...axisProps(theme)} />
            <YAxis unit={unit} {...axisProps(theme)} />
            <Tooltip
              content={<TooltipCard suffix={unit} />}
              cursor={{ stroke: theme.grid, strokeWidth: 1 }}
            />
            {series.length > 1 ? (
              <Legend
                wrapperStyle={{ fontSize: 12, fontWeight: 700, color: theme.ink.secondary }}
                iconType="plainline"
              />
            ) : null}

            {series.map((entry, index) => (
              <Area
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.name}
                stackId={stacked ? "stack" : undefined}
                stroke={seriesColor(theme, index)}
                strokeWidth={2}
                fill={`url(#rb-area-${entry.key})`}
                activeDot={{ r: 5, stroke: theme.surface, strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend
        items={series.map((entry, index) => ({
          name: entry.name,
          value: `${(last?.[entry.key] ?? 0).toLocaleString()}${unit}`,
          color: seriesColor(theme, index),
        }))}
        note={legendNote ?? "Most recent period"}
      />
    </figure>
  )
}


function CategoryTick({ x, y, payload, width, fill }) {
  const label = String(payload?.value ?? "")
  const maxCharacters = Math.max(6, Math.floor((width ?? 100) / (11 * 0.58)))

  const shown =
    label.length > maxCharacters
      ? `${label.slice(0, maxCharacters - 1).trimEnd()}…`
      : label

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={fill}
      fontSize={11}
      fontWeight={600}
    >
      <title>{label}</title>
      {shown}
    </text>
  )
}

export function BarBreakdownChart({
  data,
  categoryKey,
  valueKey,
  height = 280,
  unit = "",
  target,
  horizontal = true,
  categoryWidth = 108,
  domainMax,
}) {
  const theme = useChartTheme()
  if (!data?.length) return <ChartEmpty />
  const domain = domainMax != null ? [0, domainMax] : undefined

  const [above, below] = [seriesColor(theme, 0), seriesColor(theme, 2)]
  const colorFor = (row) =>
    target == null ? seriesColor(theme, 0) : row[valueKey] >= target ? above : below

  return (
    <figure className="w-full min-w-0">
      <div style={{ height }} className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 16, right: 20, bottom: 0, left: horizontal ? 4 : -20 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              stroke={theme.grid}
              strokeWidth={1}
              horizontal={!horizontal}
              vertical={horizontal}
            />

            {horizontal ? (
              <>
                <XAxis type="number" unit={unit} domain={domain} allowDataOverflow={false} {...axisProps(theme)} />
                <YAxis
                  type="category"
                  dataKey={categoryKey}
                  width={categoryWidth}
                  interval={0}
                  {...axisProps(theme)}
                  tick={(tickProps) => (
                    <CategoryTick
                      {...tickProps}
                      width={categoryWidth - 8}
                      fill={theme.ink.secondary}
                    />
                  )}
                />
              </>
            ) : (
              <>
                <XAxis dataKey={categoryKey} {...axisProps(theme)} />
                <YAxis unit={unit} domain={domain} {...axisProps(theme)} />
              </>
            )}

            <Tooltip content={<TooltipCard suffix={unit} />} cursor={{ fill: "rgba(127,127,127,0.08)" }} />

            {target != null ? (
              <ReferenceLine
                {...(horizontal ? { x: target } : { y: target })}
                stroke={theme.ink.muted}
                strokeWidth={1}
                label={{
                  value: `target ${target}${unit}`,
                  position: "top",
                  fill: theme.ink.secondary,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ) : null}

            <Bar
              dataKey={valueKey}
              name={valueKey}
              barSize={18}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            >
              {data.map((row, index) => (
                <Cell key={`${row[categoryKey]}-${index}`} fill={colorFor(row)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend
        items={data.map((row) => ({
          name: row[categoryKey],
          value: `${row[valueKey].toLocaleString()}${unit}`,
          color: colorFor(row),
        }))}
        note={
          target != null
            ? `Bars that reach the ${target}${unit} line are drawn in the first colour; those below it in the second.`
            : undefined
        }
      />
    </figure>
  )
}


export function StackedBarChart({
  data,
  categoryKey,
  series,
  height = 260,
  categoryWidth = 130,
  barSize = 18,
  note,
}) {
  const theme = useChartTheme()
  if (!data?.length) return <ChartEmpty />

  const last = series.length - 1

  return (
    <figure className="w-full min-w-0">
      <div style={{ height }} className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 20, bottom: 0, left: 4 }}
            barCategoryGap="30%"
          >
            <CartesianGrid stroke={theme.grid} strokeWidth={1} horizontal={false} vertical />
            <XAxis type="number" allowDecimals={false} {...axisProps(theme)} />
            <YAxis
              type="category"
              dataKey={categoryKey}
              width={categoryWidth}
              interval={0}
              {...axisProps(theme)}
              tick={(tickProps) => (
                <CategoryTick
                  {...tickProps}
                  width={categoryWidth - 8}
                  fill={theme.ink.secondary}
                />
              )}
            />
            <Tooltip content={<TooltipCard />} cursor={{ fill: "rgba(127,127,127,0.08)" }} />
            {series.map((part, index) => (
              <Bar
                key={part.key}
                dataKey={part.key}
                name={part.name}
                stackId="parts"
                barSize={barSize}
                fill={seriesColor(theme, index)}
                radius={index === last ? [0, 4, 4, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend
        items={series.map((part, index) => ({
          name: part.name,
          value: data
            .reduce((sum, row) => sum + Number(row[part.key] || 0), 0)
            .toLocaleString(),
          color: seriesColor(theme, index),
        }))}
        note={note}
      />
    </figure>
  )
}


export function DonutChart({
  data,
  nameKey = "name",
  valueKey = "value",
  height = 240,
  centerLabel,
  centerValue,
  unit = "",
}) {
  const theme = useChartTheme()
  if (!data?.length) return <ChartEmpty />

  const total = data.reduce((sum, row) => sum + Number(row[valueKey] || 0), 0)
  const colorFor = (row, index) =>
    row.isOther ? theme.other : seriesColor(theme, index)

  return (
    <figure className="w-full min-w-0">
      <div className="relative min-w-0 overflow-hidden" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<TooltipCard suffix={unit} />} />
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke={theme.surface}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((row, index) => (
                <Cell key={row[nameKey]} fill={colorFor(row, index)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {centerValue != null ? (
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <div className="font-rb-display text-2xl font-extrabold tabular-nums text-foreground">
              {centerValue}
            </div>
            {centerLabel ? (
              <div className="mt-0.5 text-[0.6875rem] font-semibold text-muted-foreground">
                {centerLabel}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <ChartLegend
        items={data.map((row, index) => ({
          name: row[nameKey],
          value: total
            ? `${Math.round((Number(row[valueKey]) / total) * 100)}%`
            : `${row[valueKey]}`,
          color: colorFor(row, index),
        }))}
        note={`${total.toLocaleString()} total`}
      />
    </figure>
  )
}


export function RadialGauge({
  value,
  label,
  height = 200,
  unit = "%",
  max = 100,
  color,
  valueInk,
  trackColor,
  labelColor,
}) {
  const theme = useChartTheme()
  const bounded = Math.max(0, Math.min(max, Number(value) || 0))
  const isCompact = height <= 110
  const isMini = height <= 76

  return (
    <figure className="w-full min-w-0">
      <div className="relative min-w-0 overflow-hidden" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ name: label, value: bounded }]}
            innerRadius={isMini ? "66%" : isCompact ? "68%" : "70%"}
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: trackColor ?? theme.track }}
              dataKey="value"
              cornerRadius={8}
              fill={color ?? seriesColor(theme, 0)}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <div
            className={`font-rb-display tabular-nums text-foreground ${
              isMini
                ? "text-base font-extrabold leading-none"
                : isCompact
                  ? "text-xl font-extrabold leading-none"
                  : "text-3xl font-extrabold"
            }`}
            style={valueInk ? { color: valueInk } : undefined}
          >
            {Math.round(bounded)}
            {unit}
          </div>
          {label ? (
            <div
              className={`font-semibold text-muted-foreground ${
                isMini
                  ? "mt-0.5 text-[9px] leading-none tracking-tight"
                  : isCompact
                    ? "mt-1 text-[10px] leading-none tracking-tight"
                    : "mt-0.5 text-[0.6875rem]"
              }`}
              style={labelColor ? { color: labelColor } : undefined}
            >
              {label}
            </div>
          ) : null}
        </div>
      </div>
    </figure>
  )
}


export function Sparkline({ data, dataKey = "value", height = 44 }) {
  const theme = useChartTheme()
  if (!data?.length) return null

  return (
    <div style={{ height }} className="w-full min-w-0 overflow-hidden" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={seriesColor(theme, 0)}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BeadedRadialGauge({
  value = 0,
  max = 100,
  color,
  label,
  sublabel,
  valueInk,
  className = "",
}) {
  const bounded = Math.max(0, Math.min(max, Number(value) || 0))
  const pct = max > 0 ? (bounded / max) * 100 : 0

  const activeColor =
    color ||
    (pct >= 75
      ? "#009688"
      : pct >= 50
      ? "#3b82f6"
      : pct >= 25
      ? "#f59e0b"
      : "#eb6b56")

  const COUNT = 10
  const CX = 72
  const CY = 80
  const R = 64
  const DOT_R = 9
  const STROKE_W = 3.5

  const SVG_W = CX
  const SVG_H = CY * 2

  const dots = useMemo(() => {
    const list = []
    const activeCount = pct > 0 ? Math.max(1, Math.round((pct / 100) * COUNT)) : 0

    for (let i = 0; i < COUNT; i++) {
      const t = COUNT > 1 ? i / (COUNT - 1) : 0
      const angleDeg = 270 - t * 180
      const angleRad = (angleDeg * Math.PI) / 180
      const x = CX + R * Math.cos(angleRad)
      const y = CY - R * Math.sin(angleRad)
      const isFilled = i < activeCount

      list.push({
        id: i,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        isFilled,
      })
    }
    return list
  }, [pct])

  return (
    <div
      className={`inline-flex items-center min-w-0 ${className}`}
      style={{ height: `${SVG_H}px` }}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ height: `${SVG_H}px`, width: `${SVG_W}px`, flexShrink: 0 }}
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="bead-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.2" />
          </filter>
        </defs>
        {dots.map((d) => (
          <circle
            key={d.id}
            cx={d.x}
            cy={d.y}
            r={DOT_R}
            fill="var(--background)"
            stroke={d.isFilled ? activeColor : "#c8d4e3"}
            strokeWidth={STROKE_W}
            filter={d.isFilled ? "url(#bead-shadow)" : undefined}
            className="transition-colors duration-300"
          />
        ))}
      </svg>

      <div
        className="flex flex-col justify-end min-w-0"
        style={{ marginLeft: '-18px' }}
      >
        <div
          className="font-rb-display text-7xl font-black leading-none tracking-tight tabular-nums shrink-0"
          style={{ color: valueInk || activeColor }}
        >
          {Math.round(bounded)}%
        </div>

        {label && (
          <div
            className="mt-1 text-xs font-bold leading-tight text-slate-600 dark:text-slate-300"
          >
            {label}
          </div>
        )}
      </div>
    </div>
  )
}
