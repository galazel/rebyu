import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Responsive } from "react-grid-layout"

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

function defaultLayout(tiles) {
  let x = 0
  let y = 0
  let rowHeight = 0

  return tiles.map((tile) => {
    const w = Math.min(tile.col ?? 2, COLS.lg)
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
  const layout = savedLayout?.length ? savedLayout : preset ?? savedLayout
  const [containerRef, width] = useContainerWidth()
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= BREAKPOINTS.lg
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
  useLayoutEffect(() => {
    if (editing) return
    const grid = viewGridRef.current
    if (!grid) return
    const gap = parseFloat(getComputedStyle(grid).columnGap) || MARGIN[0]
    const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || COLS.lg
    if (columns !== COLS.lg) return // only the desktop grid maps onto the 6-column board
    const box = grid.getBoundingClientRect()
    const colWidth = (box.width - gap * (columns - 1)) / columns
    const rowUnit = ROW_HEIGHT + MARGIN[1]
    const next = new Map()
    for (const element of grid.children) {
      const id = element.getAttribute("data-tile-id")
      if (!id) continue
      const r = element.getBoundingClientRect()
      next.set(id, {
        x: Math.max(0, Math.round((r.left - box.left) / (colWidth + gap))),
        y: Math.max(0, Math.round((r.top - box.top) / rowUnit)),
        w: Math.max(1, Math.round((r.width + gap) / (colWidth + gap))),
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
          const targetH = isCollapsed ? 1 : Math.max(item.h, tile?.row ?? 4)
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
  }, [tiles, layout, byId, collapsedTiles, orderedTiles, editing])

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

  const handleLayoutChange = (next) => {
    if (!editing) return
    movedRef.current = true
    onLayoutChange?.(
      next.map((item) => {
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
    )
  }

  // In normal view mode: render a clean CSS grid so collapsed tiles are naturally compact
  // (~60px) with no empty whitespace, and expanded tiles expand full scale to show all contents
  // without internal scrollbars.
  if (!editing) {
    // On desktop a saved arrangement is placed exactly where Rearrange put it — the
    // same columns, rows and heights, gaps included. Dense auto-flow used to pull
    // tiles up into gaps, so the view never matched what was saved.
    const placed = isDesktop && (layout ?? []).some((item) => Number.isInteger(item?.x) && Number.isInteger(item?.y))
    const savedById = new Map((layout ?? []).map((item) => [item.id ?? item.i, item]))
    return (
      <div ref={containerRef} className="w-full">
        <div
          ref={viewGridRef}
          className={
            placed
              ? "grid grid-cols-6 items-stretch gap-4"
              : "grid grid-flow-row-dense grid-cols-1 items-stretch gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-6"
          }
          style={placed ? { gridAutoRows: `${ROW_HEIGHT}px` } : undefined}
        >
          {orderedTiles.map((tile) => {
            const saved = savedById.get(tile.id)
            const span = Math.min(6, Math.max(1, Number(saved?.w ?? tile.col ?? 3)))
            const isCollapsed = Boolean(collapsedTiles[tile.id])
            const alignClass = isCollapsed ? "self-start" : "h-full flex flex-col"
            const savedRows = Number.isInteger(saved?.h) && saved.h > 0 ? saved.h : Math.max(1, tile.row ?? 3)
            const style = placed
              ? {
                  gridColumn: Number.isInteger(saved?.x)
                    ? `${Math.min(saved.x, 5) + 1} / span ${Math.min(span, 6 - Math.min(saved.x, 5))}`
                    : `span ${span}`,
                  gridRow: Number.isInteger(saved?.y) ? `${saved.y + 1} / span ${savedRows}` : `span ${savedRows}`,
                }
              : undefined
            const colSpanClass = placed
              ? ""
              : `col-span-1 ${span >= 4 ? "md:col-span-2" : "md:col-span-1"} ${LG_SPAN[span]}`

            return (
              <div
                key={tile.id}
                id={tile.id}
                data-tile-id={tile.id}
                style={style}
                className={`${colSpanClass} min-w-0 w-full transition-all duration-300 ease-out ${alignClass} ${
                  placed ? "overflow-y-auto [&>*]:min-h-full" : ""
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
        draggableHandle=".rebyu-board-handle"
        isDraggable={editing}
        isResizable={editing}
        resizeHandles={["se"]}
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
            <div key={item.i} id={item.i} className="min-w-0">
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
