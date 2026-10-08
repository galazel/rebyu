
export const BUBBLE_TONES = {
  macaw: {
    accent: "linear-gradient(135deg, #1B6EF3, #1CB0F6)",
    surface: "bg-rb-macaw-wash dark:bg-[#12283d]",
    flat: "#1CB0F6",
    ink: "text-rb-macaw-lip",
    chip: "bg-rb-macaw-wash text-rb-macaw-lip",
    solid: "#147DAF",
  },
  beetle: {
    accent: "linear-gradient(135deg, #B061E6, #CE82FF)",
    surface: "bg-rb-beetle-wash dark:bg-[#2a1f3a]",
    flat: "#CE82FF",
    ink: "text-rb-beetle-lip",
    chip: "bg-rb-beetle-wash text-rb-beetle-lip",
    solid: "#965FBA",
  },
  fox: {
    accent: "linear-gradient(135deg, #E08600, #FF9600)",
    surface: "bg-rb-fox-wash dark:bg-[#3a2a12]",
    flat: "#FF9600",
    ink: "text-rb-fox-lip",
    chip: "bg-rb-fox-wash text-rb-fox-lip",
    solid: "#8A4F00",
  },
  bee: {
    accent: "linear-gradient(135deg, #248f4c, #47b96d)",
    surface: "bg-rb-bee-wash dark:bg-[#12333a]",
    flat: "#47b96d",
    ink: "text-rb-bee-lip",
    chip: "bg-rb-bee-wash text-rb-bee-lip",
    solid: "#248f4c",
  },
  leaf: {
    accent: "linear-gradient(135deg, #3c6e46, #6aa676)",
    surface: "bg-rb-leaf-wash dark:bg-[#1a2e1e]",
    flat: "#6aa676",
    ink: "text-rb-leaf-lip",
    chip: "bg-rb-leaf-wash text-rb-leaf-lip",
    solid: "#3c6e46",
  },
  feather: {
    accent: "linear-gradient(135deg, #0b6b45, #168a5b)",
    surface: "bg-rb-feather-wash dark:bg-[#152744]",
    flat: "#168a5b",
    ink: "text-rb-feather-lip",
    chip: "bg-rb-feather-wash text-rb-feather-lip",
    solid: "#118a57",
  },
  cardinal: {
    accent: "linear-gradient(135deg, #E03D3D, #FF4B4B)",
    surface: "bg-rb-cardinal-wash dark:bg-[#3a1c1c]",
    flat: "#FF4B4B",
    ink: "text-rb-cardinal-lip",
    chip: "bg-rb-cardinal-wash text-rb-cardinal-lip",
    solid: "#C62828",
  },
}


export function toneForIndex(index) {
  const order = ["feather", "bee", "leaf"]
  return order[index % order.length]
}

export function BubbleCard({
  tone = "macaw",
  icon: Icon,
  eyebrow,
  title,
  chips = [],
  capHeight = "h-32",
  cap = "gradient",
  wordmark,
  body = "wash",
  active = false,
  compact = false,
  className = "",
  children,
  footer,
  as: Wrapper = "article",
  ...props
}) {
  const palette = BUBBLE_TONES[tone] ?? BUBBLE_TONES.macaw
  const surface = body === "card" ? "bg-card" : palette.surface
  const capFace = cap === "flat" ? palette.flat : palette.accent
  const leftChips = chips.filter((chip) => chip.side !== "right")
  const rightChips = chips.filter((chip) => chip.side === "right")

  return (
    <Wrapper

      style={{
        "--bubble-tone": palette.solid,
        "--ring": palette.solid,
        "--rb-focus": palette.solid,
      }}
      className={`group/bubble flex flex-col overflow-hidden rounded-rb-card border-2 text-left transition-colors ${
        surface
      } ${
        active
          ? "border-[color:var(--bubble-tone)]"
          : "border-border hover:border-[color:var(--bubble-tone)]"
      } ${className}`}
      {...props}
    >
      <div
        className={`relative flex ${capHeight} shrink-0 items-center justify-center overflow-hidden [container-type:inline-size]`}
        style={{ background: capFace }}
      >
        {(leftChips.length > 0 || rightChips.length > 0) && (
          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
            <span className="flex flex-wrap gap-1.5">
              {leftChips.map((chip) => (
                <span
                  key={chip.label}
                  className="rounded-rb-pill bg-white/90 px-2.5 py-1 font-rb-display text-[10px] font-extrabold uppercase tracking-wide text-rb-eel backdrop-blur-sm"
                >
                  {chip.label}
                </span>
              ))}
            </span>
            <span className="flex flex-wrap justify-end gap-1.5">
              {rightChips.map((chip) => (
                <span
                  key={chip.label}
                  className="rounded-rb-pill bg-black/35 px-2.5 py-1 font-rb-display text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm"
                >
                  {chip.label}
                </span>
              ))}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -left-7 size-32 rounded-full bg-white/10" />

        {wordmark ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-3 left-2 select-none whitespace-nowrap font-rb-display font-black lowercase leading-none text-white/20"
            style={{ fontSize: compact ? "2.75rem" : "clamp(2.5rem, 22cqw, 5rem)" }}
          >
            {wordmark}
          </span>
        ) : null}

        {Icon ? (
          <span
            className={`grid ${
              compact ? "size-14" : "size-20"
            } place-items-center rounded-full bg-white/20 text-white transition-transform duration-300 group-hover/bubble:scale-105`}
          >
            <Icon className={compact ? "size-7" : "size-10"} strokeWidth={1.7} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5"}`}>
        {eyebrow ? (
          <p
            className={`font-rb-display text-[10px] font-extrabold uppercase tracking-[0.16em] ${palette.ink}`}
          >
            {eyebrow}
          </p>
        ) : null}

        {title ? (
          <h3
            className={`mt-1 font-rb-display font-extrabold text-foreground ${
              compact ? "text-base" : "text-lg"
            }`}
          >
            {title}
          </h3>
        ) : null}

        <div className="min-w-0 flex-1">{children}</div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </Wrapper>
  )
}
