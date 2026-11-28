import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import GridLayout, { Responsive, utils as gridUtils } from "react-grid-layout"

import { GripHorizontal } from "@/components/icons"

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "./dashboard-board.css"

function useContainerWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return Math.max(320, window.innerWidth - 32)
    }
    return 0
  })

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const update = () => {
      const measured = element.offsetWidth || (typeof window !== "undefined" ? window.innerWidth - 32 : 320)
      if (measured > 0) {
        setWidth(Math.round(measured))
      }
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry?.contentRect?.width ?? element.offsetWidth))
    })
    observer.observe(element)
    update()

    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

const COLS = { lg: 6, md: 6, sm: 2, xs: 1, xxs: 1 }
const BREAKPOINTS = { lg: 1024, md: 768, sm: 640, xs: 480, xxs: 0 }
const ROW_HEIGHT = 88
const MARGIN = [16, 16]
// View mode keeps the exact saved arrangement while its NARROWEST card is at least this wide
// on the current screen; below that, cards flow instead of being squeezed. (A fixed 230px
// per grid column used to be required, which most laptop-width boards fail -- so a layout
// saved with Done was silently ignored and the board fell back to two columns.)
const MIN_PLACED_CARD_WIDTH = 300
// Board width from which flowing cards sit two to a row.
const TWO_COLUMN_MIN = 720
const MAX_TILE_HEIGHT = 20 // Learner layout API limit, in grid rows.

function learnerGridLayout(preset, placements) {
  const byId = new Map(placements?.map((item) => [item.id ?? item.i, item]))
  const grid = preset.map((item) => {
    const saved = byId.get(item.id)
    const w = Math.max(1, Math.min(COLS.lg, saved?.w ?? item.w))
    return {
      i: item.id,
      x: Math.max(0, Math.min(COLS.lg - w, saved?.x ?? item.x)),
      y: Math.max(0, saved?.y ?? item.y),
      w,
      h: Math.max(1, Math.min(MAX_TILE_HEIGHT, saved?.h ?? item.h)),
      maxH: MAX_TILE_HEIGHT,
    }
  })
  return gridUtils.compact(inReadingOrder(grid), null, COLS.lg)
}

function inReadingOrder(layout) {
  return [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
}

function stackTiles(layout) {
  let y = 0
  return inReadingOrder(layout).map((item) => {
    const stacked = { ...item, x: 0, y, w: 1 }
    y += item.h
    return stacked
  })
}

function applyStackEdits(desktop, stacked) {
  const previousOrder = inReadingOrder(desktop)
  const nextOrder = inReadingOrder(stacked)
  const byId = new Map(desktop.map((item) => [item.i, item]))
  const resized = nextOrder.map(({ i, h }) => ({ ...byId.get(i), h }))
  if (nextOrder.every((item, index) => item.i === previousOrder[index].i)) {
    return gridUtils.compact(inReadingOrder(resized), null, COLS.lg)
  }

  // A phone reorder defines reading order. Rebuild desktop rows in that order
  // while preserving each card's desktop width and its own height.
  let x = 0
  let y = 0
  let rowHeight = 0
  return resized.map((item) => {
    if (x + item.w > COLS.lg) {
      y += rowHeight
      x = 0
      rowHeight = 0
    }
    const placement = { ...item, x, y }
    x += item.w
    rowHeight = Math.max(rowHeight, item.h)
    return placement
  })
}

// The same grid stays mounted when the learner enters the editor or saves.
// Its handles are the only layout controls that depend on edit mode.
export function LearnerDashboardBoard({ tiles, layout, preset, editing, onLayoutChange }) {
  const [ref, width] = useContainerWidth()
  const desktop = useMemo(() => learnerGridLayout(preset, layout), [preset, layout])
  const stacked = width < BREAKPOINTS.md
  const visibleLayout = useMemo(() => stacked ? stackTiles(desktop) : desktop, [stacked, desktop])

  const commitGesture = (placements) => {
    const previousById = new Map(visibleLayout.map((item) => [item.i, item]))
    const changed = placements.some((item) =>
      ["x", "y", "w", "h"].some((key) => item[key] !== previousById.get(item.i)?.[key]),
    )
    if (!changed) return
    const next = stacked ? applyStackEdits(desktop, placements) : placements
    onLayoutChange(next.map(({ i, x, y, w, h }) => ({ id: i, x, y, w, h })))
  }

  return (
    <div ref={ref} className="w-full min-w-0">
      <GridLayout
        className={`rebyu-board rebyu-learner-grid ${editing ? "is-editing" : ""}`}
        width={width}
        layout={visibleLayout}
        cols={stacked ? 1 : COLS.lg}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        containerPadding={[0, 0]}
        compactType={stacked ? "vertical" : null}
        isDraggable={editing}
        isResizable={editing}
        draggableCancel=".react-resizable-handle"
        resizeHandles={stacked ? ["s"] : ["s", "e", "se"]}
        onDragStop={commitGesture}
        onResizeStop={commitGesture}
      >
        {tiles.map((tile) => (
          <div key={tile.id} id={tile.id} data-tile-id={tile.id}
            className={`rebyu-tile-cell is-sized min-w-0 ${editing ? "cursor-grab active:cursor-grabbing select-none" : ""}`}>
            {tile.element}
            {editing && (
              <span className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-lg bg-background/90 text-muted-foreground shadow-sm ring-1 ring-border" aria-hidden="true">
                <GripHorizontal className="size-4" />
              </span>
            )}
          </div>
        ))}
      </GridLayout>
    </div>
  )
}

function defaultLayout(tiles) {
  let x = 0
  let y = 0
  let rowHeight = 0

  return tiles.map((tile) => {
    const w = Math.min(Math.max(2, tile.col ?? 2), COLS.lg)
    const h = tile.row ?? 1

    if (x + w > COLS.lg) {
      x = 0
      y += rowHeight
      rowHeight = 0
    }

    const item = { i: tile.id, id: tile.id, x, y, w, h }
    x += w
    rowHeight = Math.max(rowHeight, h)
    return item
  })
}

// Static class names, so Tailwind keeps them.
const LG_SPAN = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
}

/**
 * `defaultOrder` (tile ids) and `defaultCols` ({ id: 1-6 }) let a board choose a
 * default arrangement where tiles of a similar height share a row; a saved layout
 * still wins.
 */
export function DashboardBoard({
  tiles: rawTiles,
  layout: savedLayout,
  preset = null,
  editing = false,
  onLayoutChange,
  collapsedTiles = {},
  defaultOrder = null,
  defaultCols = null,
  defaultRows = null,
}) {
  const tiles = useMemo(() => {
    const rank = new Map((defaultOrder ?? []).map((id, index) => [id, index]))
    return [...rawTiles]
      .map((tile, index) => ({ tile, index }))
      .sort((a, b) => (rank.get(a.tile.id) ?? 1000 + a.index) - (rank.get(b.tile.id) ?? 1000 + b.index))
      .map(({ tile }) => ({
        ...tile,
        col: defaultCols?.[tile.id] ?? tile.col,
        row: defaultRows?.[tile.id] ?? tile.row,
      }))
  }, [rawTiles, defaultOrder, defaultCols, defaultRows])
  // With nothing saved, the board's preset (a full default arrangement) stands in for it.
  // A saved arrangement is tidied before use: overlapping cards are pushed apart
  // and everything slides up into gaps, so a layout can never render on top of
  // itself (an older drag could save overlaps).
  const layout = useMemo(() => {
    const raw = savedLayout?.length ? savedLayout : preset ?? savedLayout
    if (!raw?.length) return raw
    const placed = raw.filter((item) => [item.x, item.y, item.w, item.h].every(Number.isInteger))
    if (placed.length !== raw.length) return raw
    const packed = gridUtils.compact(
      placed.map((item) => ({ i: item.id ?? item.i, x: Math.min(item.x, COLS.lg - 1), y: item.y, w: Math.min(item.w, COLS.lg), h: item.h })),
      "vertical",
      COLS.lg,
    )
    const byKey = new Map(packed.map((item) => [item.i, item]))
    return raw.map((item) => {
      const p = byKey.get(item.id ?? item.i)
      return p ? { ...item, x: p.x, y: p.y, w: p.w, h: p.h } : item
    })
  }, [savedLayout, preset])
  const [containerRef, width] = useContainerWidth()
  // From the measured board width (re-renders on resize), not a one-off window read.
  const isDesktop = (width || (typeof window !== "undefined" ? window.innerWidth : 0)) >= BREAKPOINTS.lg
  const byId = useMemo(() => new Map(tiles.map((tile) => [tile.id, tile])), [tiles])

  /* Where each tile actually sits in the normal view, in grid units. Rearrange mode
     starts from this, so tiles keep their real height (nothing is cut off) and the
     arrangement looks the same as the dashboard you were just looking at. */
  const viewGridRef = useRef(null)
  const measuredRef = useRef(new Map())
  // The layout a measurement was taken under; a different one (e.g. after a reset) is not reused.
  const measuredForRef = useRef(null)
  const layoutKey = JSON.stringify(layout ?? [])
  // Becomes true once a tile is dragged or resized in this rearrange session.
  const movedRef = useRef(false)
  if (!editing) movedRef.current = false
  // The arrangement being edited, kept here while rearranging. The page's own copy can
  // lag behind (a save in flight, a slow server, a data refresh re-rendering the page),
  // and feeding that back in snapped cards back mid-edit. Remounting the grid after
  // every drop papered over it but redrew every card -- the flicker. Cleared on exit.
  const [draft, setDraft] = useState(null)
  const lastEmittedKeyRef = useRef(null)
  useEffect(() => {
    if (!editing) {
      setDraft(null)
      lastEmittedKeyRef.current = null
    }
  }, [editing])
  useEffect(() => {
    if (!editing) return
    // Clear stale draft when the parent resets or replaces the layout externally.
    if (lastEmittedKeyRef.current !== null && layoutKey !== lastEmittedKeyRef.current) {
      setDraft(null)
      lastEmittedKeyRef.current = null
    }
  }, [editing, layoutKey])
  useLayoutEffect(() => {
    if (editing) return
    const grid = viewGridRef.current
    if (!grid) return
    // Only the desktop board maps onto 6 columns; below it the grid has its own layouts.
    if ((width || window.innerWidth) < BREAKPOINTS.lg) return
    const gap = parseFloat(getComputedStyle(grid).columnGap) || MARGIN[0]
    const box = grid.getBoundingClientRect()
    // Measured as fractions of the board, so this works for the saved 6-column grid
    // AND the 2-column flow a board without a saved arrangement uses. Measuring only
    // the 6-column case left flow boards with default heights in rearrange mode:
    // cards shrank and their contents vanished the moment rearranging began.
    const unit = (box.width + gap) / COLS.lg
    const rowUnit = ROW_HEIGHT + MARGIN[1]
    const next = new Map()
    for (const element of grid.children) {
      const id = element.getAttribute("data-tile-id")
      if (!id) continue
      const r = element.getBoundingClientRect()
      const w = Math.min(COLS.lg, Math.max(1, Math.round((r.width + gap) / unit)))
      next.set(id, {
        x: Math.min(COLS.lg - w, Math.max(0, Math.round((r.left - box.left) / unit))),
        y: Math.max(0, Math.round((r.top - box.top) / rowUnit)),
        w,
        h: Math.max(1, Math.ceil((r.height + MARGIN[1]) / rowUnit)),
      })
    }
    if (next.size) {
      measuredRef.current = next
      measuredForRef.current = layoutKey
    }
  })

  const orderedTiles = useMemo(() => {
    const rawSaved = (layout ?? [])
      .map((item) => ({
        id: item.id ?? item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }))
      .filter((item) => byId.has(item.id))

    const savedIds = new Set(rawSaved.map((item) => item.id))
    const missing = tiles.filter((tile) => !savedIds.has(tile.id))

    if (rawSaved.length > 0) {
      return [
        ...[...rawSaved].sort((a, b) => a.y - b.y || a.x - b.x).map((s) => byId.get(s.id)),
        ...missing,
      ].filter(Boolean)
    }
    return tiles
  }, [tiles, layout, byId])

  const currentLayout = useMemo(() => {
    if (editing && draft) return draft
    const measured = measuredRef.current
    if (
      editing &&
      !movedRef.current &&
      measuredForRef.current === layoutKey &&
      measured.size &&
      tiles.every((tile) => measured.has(tile.id))
    ) {
      return tiles.map((tile) => {
        const m = measured.get(tile.id)
        return { i: tile.id, id: tile.id, x: Math.min(m.x, COLS.lg - 1), y: m.y, w: Math.min(m.w, COLS.lg), h: m.h }
      })
    }
    const rawSaved = (layout ?? [])
      .map((item) => ({
        id: item.id ?? item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }))
      .filter(
        (item) =>
          byId.has(item.id) &&
          [item.x, item.y, item.w, item.h].every((value) => Number.isInteger(value))
      )
    const savedIds = new Set(rawSaved.map((item) => item.id))
    const missing = tiles.filter((tile) => !savedIds.has(tile.id))

    if (rawSaved.length > 0) {
      const lowest = rawSaved.reduce((max, item) => Math.max(max, item.y + item.h), 0)
      const fallback = defaultLayout(missing)
      return [
        ...rawSaved.map((item) => {
          const tileId = item.id
          const isCollapsed = Boolean(collapsedTiles[tileId])
          const tile = byId.get(tileId)
          const targetH = isCollapsed ? 1 : Math.max(1, item.h ?? tile?.row ?? 4)
          return { i: tileId, id: tileId, x: item.x, y: item.y, w: item.w, h: targetH }
        }),
        ...fallback.map((item) => {
          const tileId = item.id ?? item.i
          const isCollapsed = Boolean(collapsedTiles[tileId])
          const tile = byId.get(tileId)
          const targetH = isCollapsed ? 1 : Math.max(item.h, tile?.row ?? 4)
          return { ...item, i: tileId, id: tileId, y: item.y + lowest, h: targetH }
        }),
      ]
    }

    return defaultLayout(orderedTiles)
  }, [tiles, layout, byId, collapsedTiles, orderedTiles, editing, draft])

  const layouts = useMemo(() => {
    const sortedForResponsive = [...currentLayout].sort((a, b) => a.y - b.y || a.x - b.x)

    let mobileY = 0
    const mobileLayout = sortedForResponsive.map((item) => {
      const tile = byId.get(item.i)
      const isCollapsed = Boolean(collapsedTiles[item.i])
      const extraHeight = !isCollapsed && item.i === "dept-progress" ? 1 : 0
      const h = isCollapsed ? 1 : Math.max(tile?.row ?? 1, item.h, measuredRef.current.get(item.i)?.h ?? 0) + extraHeight
      const layoutItem = {
        i: item.i,
        x: 0,
        y: mobileY,
        w: 1,
        h,
      }
      mobileY += h
      return layoutItem
    })

    let smCol0Y = 0
    let smCol1Y = 0
    const smLayout = sortedForResponsive.map((item) => {
      const isCollapsed = Boolean(collapsedTiles[item.i])
      const tile = byId.get(item.i)
      const targetH = isCollapsed ? 1 : Math.max(item.h, tile?.row ?? 4, measuredRef.current.get(item.i)?.h ?? 0)
      const w = Math.min(item.w, 2)
      const h = targetH
      let x = 0
      let y = 0
      if (w === 2) {
        y = Math.max(smCol0Y, smCol1Y)
        x = 0
        smCol0Y = y + h
        smCol1Y = y + h
      } else {
        if (smCol0Y <= smCol1Y) {
          x = 0
          y = smCol0Y
          smCol0Y += h
        } else {
          x = 1
          y = smCol1Y
          smCol1Y += h
        }
      }
      return {
        i: item.i,
        x,
        y,
        w,
        h,
      }
    })

    return {
      lg: currentLayout,
      md: currentLayout,
      sm: smLayout,
      xs: mobileLayout,
      xxs: mobileLayout,
    }
  }, [currentLayout, byId, collapsedTiles])

  const handleLayoutChange = (dropped) => {
    if (!editing) return
    movedRef.current = true
    // The dropped card keeps the spot it was dropped on (cards under it moved
    // down); then everything slides up into the gaps that left behind. Packing
    // during the drag is off because it sent a card dropped beside one in the same
    // row back underneath it.
    const cols = Object.entries(BREAKPOINTS)
      .sort((a, b) => b[1] - a[1])
      .find(([, min]) => width >= min)?.[0]
    const next = gridUtils.compact(dropped, "vertical", COLS[cols] ?? COLS.lg)
    const nextDraft = next.map((item) => ({ i: item.i, id: item.i, x: item.x, y: item.y, w: item.w, h: item.h }))
    const emitted = next.map((item) => {
      const isCollapsed = Boolean(collapsedTiles[item.i])
      const tile = byId.get(item.i)
      return {
        id: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: isCollapsed ? (tile?.row ?? 4) : item.h,
      }
    })
    lastEmittedKeyRef.current = JSON.stringify(emitted)
    setDraft(nextDraft)
    onLayoutChange?.(emitted)
  }

  // In normal view mode: render a clean CSS grid so collapsed tiles are naturally compact
  // (~60px) with no empty whitespace, and expanded tiles expand full scale to show all contents
  // without internal scrollbars.
  if (!editing) {
    // On desktop a saved arrangement is placed exactly where Rearrange put it — the
    // same columns, rows and heights, gaps included. Dense auto-flow used to pull
    // tiles up into gaps, so the view never matched what was saved.
    // Responsive by the board's OWN width (the sidebar takes part of the window), re-measured on
    // every resize. The exact saved arrangement needs columns wide enough for a one-column card;
    // narrower than that, a one-column card (the streak, say) was squeezed to ~200px inside a
    // fixed height and clipped. Below it, cards flow in saved order: two columns, then one, with
    // heights that follow their content.
    const boardWidth = width || (typeof window !== "undefined" ? window.innerWidth : 0)
    const columnWidth = (boardWidth - 5 * MARGIN[0]) / 6
    const hasPlacement = (layout ?? []).some((item) => Number.isInteger(item?.x) && Number.isInteger(item?.y))
    const narrowestSavedSpan = Math.min(
        ...(layout ?? []).map((item) => Number(item?.w)).filter((w) => Number.isInteger(w) && w > 0),
        COLS.lg,
    )
    const narrowestCardWidth = narrowestSavedSpan * columnWidth + (narrowestSavedSpan - 1) * MARGIN[0]
    const placed = hasPlacement && isDesktop && narrowestCardWidth >= MIN_PLACED_CARD_WIDTH
    const flowColumns = boardWidth >= TWO_COLUMN_MIN ? 2 : 1
    const savedById = new Map((layout ?? []).map((item) => [item.id ?? item.i, item]))
    const flowOrder = placed ? orderedTiles : [...orderedTiles].sort((a, b) => {
      const sa = savedById.get(a.id)
      const sb = savedById.get(b.id)
      if (!sa || !sb) return 0
      return (sa.y ?? 0) - (sb.y ?? 0) || (sa.x ?? 0) - (sb.x ?? 0)
    })
    return (
      <div ref={containerRef} className="w-full">
        <div
          ref={viewGridRef}
          className={placed ? "grid grid-cols-6 items-stretch gap-4" : "grid items-start gap-4 sm:gap-5"}
          style={placed
            ? { gridAutoRows: `${ROW_HEIGHT}px` }
            : { gridTemplateColumns: `repeat(${flowColumns}, minmax(0, 1fr))` }}
        >
          {flowOrder.map((tile) => {
            const saved = savedById.get(tile.id)
            const span = Math.min(6, Math.max(1, Number(saved?.w ?? tile.col ?? 3)))
            const isCollapsed = Boolean(collapsedTiles[tile.id])
            // In flow mode, grid-row stretching makes a short card inherit its
            // neighbour's height. Keep the fixed height only for an explicitly
            // placed grid; ordinary saved layouts should hug their content.
            const alignClass = isCollapsed
              ? "self-start"
              : placed
                ? "h-full flex flex-col"
                : "flex flex-col"
            const savedRows = Number.isInteger(saved?.h) && saved.h > 0 ? saved.h : Math.max(1, tile.row ?? 3)
            const style = placed
              ? {
                  gridColumn: Number.isInteger(saved?.x)
                    ? `${Math.min(saved.x, 6 - span) + 1} / span ${span}`
                    : `span ${span}`,
                  gridRow: Number.isInteger(saved?.y) ? `${saved.y + 1} / span ${savedRows}` : `span ${savedRows}`,
                }
              : undefined
            // Flow mode: a card saved wide (4+ of 6 columns) spans both columns; the rest take one.
            const flowStyle = !placed && flowColumns === 2 && span >= 4 ? { gridColumn: "span 2" } : undefined
            const colSpanClass = ""

            return (
              <div
                key={tile.id}
                id={tile.id}
                data-tile-id={tile.id}
                style={style ?? flowStyle}
                className={`${colSpanClass} rebyu-tile-cell min-w-0 w-full transition-all duration-300 ease-out ${alignClass} ${
                  placed ? "is-sized" : ""
                }`}
              >
                {tile.element}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      {width === 0 ? (
        <div className="h-96" aria-hidden="true" />
      ) : (
      <Responsive
        key={JSON.stringify(collapsedTiles)}
        width={width}
        className={`rebyu-board ${editing ? "is-editing" : ""}`}
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={width < 640 ? 84 : ROW_HEIGHT}
        margin={width < 640 ? [12, 12] : MARGIN}
        containerPadding={[0, 0]}
        // The whole card is the drag target while rearranging (the small grip alone
        // was easy to miss); its own controls stay clickable.
        draggableCancel="a, input, select, textarea, label, button:not(.rebyu-board-handle), [role='tab'], [role='switch'], [role='combobox'], .react-resizable-handle"
        isDraggable={editing}
        isResizable={editing}
        // Bottom edge (taller), right edge (wider) and the corner (both): one 20px
        // corner alone was too small to find.
        resizeHandles={["s", "e", "se"]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        allowOverlap={false}
        onDragStop={handleLayoutChange}
        onResizeStop={handleLayoutChange}
      >
        {currentLayout.map((item) => {
          const tile = byId.get(item.i)
          if (!tile) return null

          return (
            <div key={item.i} id={item.i} className={`rebyu-tile-cell is-sized min-w-0 ${editing ? "cursor-grab active:cursor-grabbing select-none" : ""}`}>
              {tile.element}

              {editing ? (
                <button
                  type="button"
                  aria-label={`Move ${item.i.replaceAll("-", " ")}`}
                  className="rebyu-board-handle absolute right-2 top-2 z-10 grid size-7 cursor-grab place-items-center rounded-lg bg-background/90 text-muted-foreground shadow-sm ring-1 ring-border transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:cursor-grabbing"
                >
                  <GripHorizontal className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          )
        })}
      </Responsive>
      )}
    </div>
  )
}
