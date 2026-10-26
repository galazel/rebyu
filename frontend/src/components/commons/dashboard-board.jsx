import { useEffect, useMemo, useRef, useState } from "react"
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
const ROW_HEIGHT = 176
const MARGIN = [20, 20]

function defaultLayout(tiles) {
  let x = 0
  let y = 0
  let rowHeight = 0

  return tiles.map((tile) => {
    const w = Math.min(tile.col ?? 2, COLS.lg)
    const h = tile.row ?? 1

    if (Number.isInteger(tile.x) && Number.isInteger(tile.y)) {
      y = Math.max(y, tile.y + h)
      rowHeight = 0
      x = 0
      return { i: tile.id, x: Math.min(tile.x, COLS.lg - w), y: tile.y, w, h }
    }

    if (x + w > COLS.lg) {
      x = 0
      y += rowHeight
      rowHeight = 0
    }

    const item = { i: tile.id, x, y, w, h }
    x += w
    rowHeight = Math.max(rowHeight, h)
    return item
  })
}

export function DashboardBoard({ tiles, layout, editing = false, onLayoutChange }) {
  const [containerRef, width] = useContainerWidth()
  const byId = useMemo(() => new Map(tiles.map((tile) => [tile.id, tile])), [tiles])

  const currentLayout = useMemo(() => {
    const saved = (layout ?? []).filter(
      (item) =>
        byId.has(item.id) &&
        [item.x, item.y, item.w, item.h].every((value) => Number.isInteger(value))
    )
    const savedIds = new Set(saved.map((item) => item.id))

    const missing = tiles.filter((tile) => !savedIds.has(tile.id))
    const fallback = defaultLayout(missing)
    const lowest = saved.reduce((max, item) => Math.max(max, item.y + item.h), 0)

    return [
      ...saved.map((item) => ({ i: item.id, x: item.x, y: item.y, w: item.w, h: item.h })),
      ...fallback.map((item) => ({ ...item, y: item.y + lowest })),
    ]
  }, [tiles, layout, byId])

  const layouts = useMemo(() => {
    let mobileY = 0
    const mobileLayout = currentLayout.map((item) => {
      const tile = byId.get(item.i)
      const extraHeight = item.i === "dept-section-breakdown" ? 1 : item.i === "dept-progress" ? 1 : 0
      const h = Math.max(item.h, (tile?.row ?? 1) + extraHeight)
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
    const smLayout = currentLayout.map((item) => {
      const w = Math.min(item.w, 2)
      const h = item.h
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
  }, [currentLayout, byId])

  const handleLayoutChange = (next) => {
    if (!editing) return
    onLayoutChange?.(
      next.map((item) => ({ id: item.i, x: item.x, y: item.y, w: item.w, h: item.h }))
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      {width === 0 ? (
        <div className="h-96" aria-hidden="true" />
      ) : (
      <Responsive
        width={width}
        className={`rebyu-board ${editing ? "is-editing" : ""}`}
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={width < 640 ? 140 : ROW_HEIGHT}
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
