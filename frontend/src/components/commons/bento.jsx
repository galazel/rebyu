
const TILE_TONES = {
  plain: "border-border bg-card text-foreground",
  macaw: "border-rb-macaw/30 bg-rb-macaw-wash text-rb-eel dark:bg-[#12283d] dark:text-rb-snow",
  beetle: "border-rb-beetle/30 bg-rb-beetle-wash text-rb-eel dark:bg-[#2a1f3a] dark:text-rb-snow",
  fox: "border-rb-fox/30 bg-rb-fox-wash text-rb-eel dark:bg-[#3a2a12] dark:text-rb-snow",
  leaf: "border-rb-leaf/30 bg-rb-leaf-wash text-rb-eel dark:bg-[#1e2e14] dark:text-rb-snow",
  bee: "border-rb-bee/30 bg-rb-bee-wash text-rb-eel dark:bg-[#12333a] dark:text-rb-snow",
  feather:
    "border-rb-feather/30 bg-rb-feather-wash text-rb-eel dark:bg-[#152744] dark:text-rb-snow",
  cardinal:
    "border-rb-cardinal/40 bg-rb-cardinal-wash text-rb-eel dark:bg-[#3a1618] dark:text-rb-snow",
  ink: "border-rb-eel bg-rb-eel text-rb-snow",
}

const TONE_INK = {
  plain: "text-muted-foreground",
  macaw: "text-rb-macaw-lip",
  beetle: "text-rb-beetle-lip",
  fox: "text-rb-fox-lip",
  bee: "text-rb-bee-lip",
  feather: "text-rb-feather-lip",
  ink: "text-rb-hare",
}

const COL_SPAN = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
}

const ROW_SPAN = {
  1: "lg:row-span-1",
  2: "lg:row-span-2",
  3: "lg:row-span-3",
  4: "lg:row-span-4",
  5: "lg:row-span-5",
}

export function BentoGrid({ className = "", children }) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[176px] lg:grid-flow-row-dense lg:grid-cols-6 lg:gap-5 ${className}`}
    >
      {children}
    </div>
  )
}

export function BentoSkeleton({ rows = 2, className = "" }) {
  return (
    <div className={`mt-4 space-y-2 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="h-10 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

export function BentoTile({
  tone = "plain",
  col = 2,
  row = 1,
  className = "",
  children,
  ...props
}) {
  return (
    <section
      className={`flex min-w-0 flex-col overflow-hidden rb-bento-tile rounded-rb-card border-2 p-5 sm:p-6 ${
        TILE_TONES[tone] ?? TILE_TONES.plain
      } ${COL_SPAN[col]} ${ROW_SPAN[row]} ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}

export function BentoStat({ tone = "plain", col = 2, row = 1, icon: Icon, label, value, hint, children }) {
  const valueSize = hint
    ? "text-4xl sm:text-5xl"
    : col === 1
      ? "text-5xl"
      : "text-5xl sm:text-6xl"

  return (
    <BentoTile tone={tone} col={col} row={row}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-bold ${TONE_INK[tone] ?? TONE_INK.plain}`}>{label}</p>
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/60 text-rb-eel dark:bg-white/10 dark:text-rb-snow">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      {children ? <div className="mt-3 min-w-0">{children}</div> : null}


      <p
        className={`mt-auto font-rb-display font-extrabold leading-[0.9] tracking-tight tabular-nums ${valueSize}`}
      >
        {value}
      </p>

      {hint ? (
        <p
          className={`mt-1 line-clamp-1 text-xs font-semibold leading-snug ${
            TONE_INK[tone] ?? TONE_INK.plain
          }`}
        >
          {hint}
        </p>
      ) : null}
    </BentoTile>
  )
}

export function BentoHeading({ icon: Icon, kicker, title, hint, action, chip }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          {kicker ? (
            <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-emerald-700 dark:text-emerald-400">
              {kicker}
            </h3>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-rb-display text-sm font-extrabold lowercase">{title}</h2>
            {chip ?? null}
          </div>
          {hint ? (
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
