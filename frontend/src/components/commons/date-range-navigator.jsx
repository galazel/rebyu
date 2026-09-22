/**
 * DateRangeNavigator
 * ------------------
 * A compact period-selector strip: [Mode ▾]  <  Label  >
 * Clicking the middle label opens a portaled visual picker
 * (calendar / month grid / year grid) appropriate for the current mode.
 *
 * Frontend-only shell — exposes `onRangeChange(range)` for future backend wiring.
 */
import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "@/components/icons"
import {
  useDateRange,
  startOfISOWeek,
  MONTHS_SHORT,
  MONTHS_FULL,
} from "@/hooks/use-date-range"

// ─── constants ────────────────────────────────────────────────────────────────

const MODES = ["daily", "weekly", "monthly", "yearly"]
const MODE_LABELS = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" }
const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] // ISO Mon-start

// ─── helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function dayIsInWeek(day, weekStart) {
  if (!weekStart) return false
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return day >= weekStart && day <= weekEnd
}

function isAfterToday(date) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

/**
 * Returns a 42-cell (6×7) array of Date objects for a Mon-start calendar grid.
 * Cells outside the current month are included for visual padding.
 */
function buildCalendarGrid(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  // Monday = 0 offset; Sunday = 6 offset
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1
  const cells = []
  // Prev-month padding
  for (let i = startPad - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), current: false })
  }
  // Current month
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), current: true })
  }
  // Next-month padding to fill 42 cells
  let next = 1
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, next++), current: false })
  }
  return cells
}

// ─── Picker Popover ───────────────────────────────────────────────────────────

function Picker({ mode, cursor, onSelect, onClose }) {
  const pickerRef = useRef(null)
  const today = useMemo(() => new Date(), [])

  // Navigation view: "days" | "months" | "years"
  const [view, setView] = useState(() => {
    if (mode === "yearly") return "years"
    if (mode === "monthly") return "months"
    return "days"
  })

  // Internal navigation state (separate from the main cursor)
  const [pickerYear,  setPickerYear]  = useState(cursor.getFullYear())
  const [pickerMonth, setPickerMonth] = useState(cursor.getMonth())
  const [decadeStart, setDecadeStart] = useState(Math.floor(cursor.getFullYear() / 12) * 12)
  const [hoveredWeek, setHoveredWeek] = useState(null)

  // Reset view when mode or cursor changes
  useEffect(() => {
    setView(mode === "yearly" ? "years" : mode === "monthly" ? "months" : "days")
    setPickerYear(cursor.getFullYear())
    setPickerMonth(cursor.getMonth())
    setDecadeStart(Math.floor(cursor.getFullYear() / 12) * 12)
  }, [mode, cursor])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const calCells = useMemo(
    () => (mode === "daily" || mode === "weekly") ? buildCalendarGrid(pickerYear, pickerMonth) : [],
    [mode, pickerYear, pickerMonth]
  )

  const selectedWeekStart = mode === "weekly" ? startOfISOWeek(cursor) : null

  // ── Calendar (daily + weekly) ───────────────────────────────────────────────
  function CalendarPicker() {
    function prevMonth() {
      if (pickerMonth === 0) { setPickerYear(y => y - 1); setPickerMonth(11) }
      else setPickerMonth(m => m - 1)
    }
    function nextMonth() {
      const next = new Date(pickerYear, pickerMonth + 1, 1)
      if (isAfterToday(next) && next.getMonth() !== today.getMonth()) return
      if (pickerMonth === 11) { setPickerYear(y => y + 1); setPickerMonth(0) }
      else setPickerMonth(m => m + 1)
    }
    const canNextMonth = (() => {
      const next = new Date(pickerYear, pickerMonth + 1, 1)
      return next.getFullYear() < today.getFullYear() ||
        (next.getFullYear() === today.getFullYear() && next.getMonth() <= today.getMonth())
    })()

    return (
      <div className="w-[248px]">
        {/* Month & Year header */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer select-none"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setView("months")}
              className="rounded-md px-1.5 py-0.5 text-[13px] font-semibold text-foreground transition hover:bg-muted hover:text-primary cursor-pointer select-none"
              title="Click to jump to another month"
            >
              {MONTHS_FULL[pickerMonth]}
            </button>
            <button
              type="button"
              onClick={() => {
                setDecadeStart(Math.floor(pickerYear / 12) * 12)
                setView("years")
              }}
              className="rounded-md px-1.5 py-0.5 text-[13px] font-semibold text-foreground transition hover:bg-muted hover:text-primary cursor-pointer select-none"
              title="Click to jump to another year"
            >
              {pickerYear}
            </button>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            disabled={!canNextMonth}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer select-none"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {WEEK_DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground/60">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calCells.map(({ date, current }, idx) => {
            const future   = isAfterToday(date)
            const isToday  = isSameDay(date, today)

            if (mode === "daily") {
              const selected = isSameDay(date, cursor)
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={future}
                  onClick={() => onSelect(date)}
                  className={[
                    "flex h-8 w-full items-center justify-center rounded-md text-[12px] transition cursor-pointer select-none",
                    future
                      ? "cursor-not-allowed text-muted-foreground/30"
                      : selected
                      ? "bg-primary text-primary-foreground font-bold"
                      : isToday
                      ? "ring-1 ring-primary/50 text-primary font-semibold hover:bg-primary/10"
                      : current
                      ? "text-foreground hover:bg-muted font-medium"
                      : "text-muted-foreground/50 hover:bg-muted/50",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              )
            }

            // Weekly mode
            const wStart    = startOfISOWeek(date)
            const inHovered = dayIsInWeek(date, hoveredWeek)
            const inSelected = dayIsInWeek(date, selectedWeekStart)
            const wFuture  = isAfterToday(wStart)
            const isFirstInRow = (idx % 7 === 0) || isSameDay(date, wStart)
            const isLastInRow  = (idx % 7 === 6) || isSameDay(date, new Date(wStart.getTime() + 6 * 86400000))

            return (
              <button
                key={idx}
                type="button"
                disabled={wFuture}
                onClick={() => !wFuture && onSelect(wStart)}
                onMouseEnter={() => !wFuture && setHoveredWeek(wStart)}
                onMouseLeave={() => setHoveredWeek(null)}
                className={[
                  "flex h-8 w-full items-center justify-center text-[12px] transition cursor-pointer select-none",
                  wFuture
                    ? "cursor-not-allowed text-muted-foreground/30"
                    : inSelected
                    ? [
                        "bg-primary/15 text-primary font-bold",
                        isSameDay(date, selectedWeekStart) ? "rounded-l-md" : "",
                        isSameDay(date, new Date(selectedWeekStart.getTime() + 6 * 86400000)) ? "rounded-r-md" : "",
                      ].join(" ")
                    : inHovered
                    ? [
                        "bg-muted text-foreground font-medium",
                        isFirstInRow ? "rounded-l-md" : "",
                        isLastInRow  ? "rounded-r-md" : "",
                      ].join(" ")
                    : current
                    ? "text-foreground"
                    : "text-muted-foreground/50",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Month grid picker ───────────────────────────────────────────────────────
  function MonthPicker() {
    const canNext = pickerYear < today.getFullYear()
    return (
      <div className="w-[220px]">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPickerYear(y => y - 1)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer select-none"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDecadeStart(Math.floor(pickerYear / 12) * 12)
              setView("years")
            }}
            className="rounded-md px-2 py-0.5 text-[13px] font-semibold text-foreground transition hover:bg-muted hover:text-primary cursor-pointer select-none"
            title="Click to jump to another year"
          >
            {pickerYear}
          </button>
          <button
            type="button"
            onClick={() => setPickerYear(y => y + 1)}
            disabled={!canNext}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer select-none"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS_SHORT.map((name, m) => {
            const future = pickerYear > today.getFullYear() ||
              (pickerYear === today.getFullYear() && m > today.getMonth())
            const selected = cursor.getFullYear() === pickerYear && cursor.getMonth() === m
            return (
              <button
                key={name}
                type="button"
                disabled={future}
                onClick={() => {
                  setPickerMonth(m)
                  if (mode === "monthly") {
                    onSelect(new Date(pickerYear, m, 1))
                  } else {
                    setView("days")
                  }
                }}
                className={[
                  "h-9 rounded-md text-[12px] font-medium transition cursor-pointer select-none",
                  future
                    ? "cursor-not-allowed text-muted-foreground/30"
                    : selected
                    ? "bg-primary text-primary-foreground font-bold"
                    : m === today.getMonth() && pickerYear === today.getFullYear()
                    ? "ring-1 ring-primary/50 text-primary hover:bg-primary/10"
                    : "text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Year grid picker ────────────────────────────────────────────────────────
  function YearPicker() {
    const years = Array.from({ length: 12 }, (_, i) => decadeStart + i)
    const canNextDecade = decadeStart + 12 <= today.getFullYear()
    const rangeLabel = `${decadeStart} – ${decadeStart + 11}`
    return (
      <div className="w-[220px]">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDecadeStart(d => d - 12)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer select-none"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="text-[13px] font-semibold text-foreground">{rangeLabel}</span>
          <button
            type="button"
            onClick={() => setDecadeStart(d => d + 12)}
            disabled={!canNextDecade}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer select-none"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {years.map(year => {
            const future   = year > today.getFullYear()
            const selected = year === pickerYear
            return (
              <button
                key={year}
                type="button"
                disabled={future}
                onClick={() => {
                  setPickerYear(year)
                  if (mode === "yearly") {
                    onSelect(new Date(year, 0, 1))
                  } else if (mode === "monthly") {
                    setView("months")
                  } else {
                    // daily or weekly
                    if (year === today.getFullYear() && pickerMonth > today.getMonth()) {
                      setPickerMonth(today.getMonth())
                    }
                    setView("days")
                  }
                }}
                className={[
                  "h-9 rounded-md text-[12px] font-medium transition cursor-pointer select-none",
                  future
                    ? "cursor-not-allowed text-muted-foreground/30"
                    : selected
                    ? "bg-primary text-primary-foreground font-bold"
                    : year === today.getFullYear()
                    ? "ring-1 ring-primary/50 text-primary hover:bg-primary/10"
                    : "text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {year}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const pickerContent = (() => {
    if (view === "years") return <YearPicker />
    if (view === "months") return <MonthPicker />
    return <CalendarPicker />
  })()

  return (
    <div
      ref={pickerRef}
      className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border border-border/80 bg-card p-3.5 shadow-xl ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in-0 slide-in-from-top-2 duration-150 ease-out"
    >
      {pickerContent}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {{ onRangeChange?: (r: {mode: string, from: Date, to: Date}) => void, className?: string }} props
 */
export function DateRangeNavigator({ onRangeChange, className = "" }) {
  const today = useMemo(() => new Date(), [])

  const [mode,   setMode]   = useState("yearly")
  const [cursor, setCursor] = useState(() => new Date())

  const [modeOpen,   setModeOpen]   = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const modeContainerRef   = useRef(null)
  const pickerContainerRef = useRef(null)

  // Outside click to close mode dropdown
  useEffect(() => {
    if (!modeOpen) return
    function handleClick(e) {
      if (modeContainerRef.current && !modeContainerRef.current.contains(e.target)) {
        setModeOpen(false)
      }
    }
    function handleKey(e) { if (e.key === "Escape") setModeOpen(false) }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [modeOpen])

  // Outside click to close date/year picker
  useEffect(() => {
    if (!pickerOpen) return
    function handleClick(e) {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target)) {
        setPickerOpen(false)
      }
    }
    function handleKey(e) { if (e.key === "Escape") setPickerOpen(false) }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [pickerOpen])

  const { label, canGoForward, from, to } = useDateRange(mode, cursor)

  // Notify parent whenever the range changes
  useEffect(() => {
    onRangeChange?.({ mode, from, to })
  }, [mode, from, to, onRangeChange])

  const navigate = useCallback((dir) => {
    setCursor(prev => {
      const d = new Date(prev)
      if (mode === "daily")        d.setDate(d.getDate() + dir)
      else if (mode === "weekly")  d.setDate(d.getDate() + 7 * dir)
      else if (mode === "monthly") d.setMonth(d.getMonth() + dir)
      else                         d.setFullYear(d.getFullYear() + dir)
      return d
    })
  }, [mode])

  // When mode changes, snap cursor back to today to avoid e.g.
  // being on "Week 1 2020" and switching to yearly showing 2020.
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode)
    setCursor(new Date())
    setPickerOpen(false)
  }, [])

  const handlePickerSelect = useCallback((date) => {
    setCursor(date)
    setPickerOpen(false)
  }, [])

  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      {/* ── Mode Dropdown ── */}
      <div ref={modeContainerRef} className="relative">
        <button
          type="button"
          id="date-range-mode-trigger"
          onClick={() => { setModeOpen(o => !o); setPickerOpen(false) }}
          className={[
            "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold transition cursor-pointer select-none",
            modeOpen
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:bg-muted",
          ].join(" ")}
        >
          {MODE_LABELS[mode]}
          <ChevronDown className={`size-3 transition-transform duration-200 ${modeOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
        </button>

        {modeOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 z-50 min-w-[120px] overflow-hidden rounded-xl border border-border/80 bg-card p-1 shadow-lg ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in-0 slide-in-from-top-2 duration-150 ease-out"
          >
            {MODES.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { handleModeChange(m); setModeOpen(false) }}
                className={[
                  "flex w-full items-center rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors duration-150",
                  m === mode
                    ? "text-primary font-bold bg-primary/10"
                    : "text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {MODE_LABELS[m]}
                {m === mode && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Period Navigation ── */}
      <div className="flex items-center gap-0.5">
        {/* Back arrow */}
        <button
          type="button"
          id="date-range-prev"
          onClick={() => navigate(-1)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer select-none"
          title="Previous period"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        {/* Clickable label with Picker */}
        <div ref={pickerContainerRef} className="relative">
          <button
            type="button"
            id="date-range-label"
            onClick={() => { setPickerOpen(o => !o); setModeOpen(false) }}
            className={[
              "h-7 min-w-[110px] rounded-md px-2.5 text-[12px] font-semibold transition cursor-pointer select-none",
              pickerOpen
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {label}
          </button>

          {/* ── Picker Popover ── */}
          {pickerOpen && (
            <Picker
              mode={mode}
              cursor={cursor}
              onSelect={handlePickerSelect}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>

        {/* Forward arrow */}
        <button
          type="button"
          id="date-range-next"
          onClick={() => canGoForward && navigate(1)}
          disabled={!canGoForward}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer select-none"
          title="Next period"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
