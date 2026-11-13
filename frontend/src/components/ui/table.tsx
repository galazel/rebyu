import * as React from "react"

import { cn } from "@/lib/utils"
import "./table-responsive.css"

function Table({ className, ref, mobileLayout = "cards", ...props }: React.ComponentProps<"table"> & {
  mobileLayout?: "cards" | "scroll"
}) {
  const tableRef = React.useRef<HTMLTableElement | null>(null)
  const [view, setView] = React.useState(mobileLayout)
  const hintId = React.useId()

  React.useEffect(() => {
    const table = tableRef.current
    if (!table) return
    // Read the rendered headings so custom headers (including sort controls),
    // dynamic columns, and native table cells share the same mobile labels.
    const labelCells = () => {
      const headings = Array.from(table.tHead?.rows ?? []).at(-1)?.cells
      if (!headings) return
      const labels = Array.from(headings).flatMap((cell, index) =>
        Array(cell.colSpan).fill(cell.textContent?.trim() || (index === headings.length - 1 ? "Actions" : `Column ${index + 1}`))
      )
      table.dataset.hasHeadings = "true"
      for (const body of table.tBodies) {
        for (const row of body.rows) {
          let column = 0
          for (const cell of row.cells) {
            cell.dataset.label = cell.colSpan > 1 ? "" : labels[column] ?? ""
            column += cell.colSpan
          }
        }
      }
    }
    labelCells()
    const observer = new MutationObserver(labelCells)
    observer.observe(table, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="rb-responsive-table min-w-0 max-w-full" data-mobile-view={view}>
      <div className="rb-table-mobile-controls">
        <span id={hintId}>{view === "cards" ? "Each record shows all fields below." : "Swipe left or right to see all columns."}</span>
        <div className="rb-table-view-options" role="group" aria-label="Mobile table view">
          <button type="button" aria-pressed={view === "cards"} onClick={() => setView("cards")}>Cards</button>
          <button type="button" aria-pressed={view === "scroll"} onClick={() => setView("scroll")}>Table</button>
        </div>
      </div>
      <div data-slot="table-container" className="relative min-w-0 max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label={props["aria-label"] ?? "Table records"} aria-describedby={hintId}>
      <table
        ref={(node) => {
          tableRef.current = node
          if (typeof ref === "function") return ref(node)
          if (ref) ref.current = node
        }}
        role="table"
        data-slot="table"
        className={cn("w-full caption-bottom text-[15px]", className)}
        {...props}
      />
      </div>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      role="rowgroup"
      className={cn(
        "bg-muted/40 [&_tr]:border-b [&_tr]:border-border/60 [&_tr]:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      role="rowgroup"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      role="rowgroup"
      className={cn(
        "border-t border-border/60 bg-muted/40 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      role="row"
      className={cn(
        "border-b border-border/40 transition-colors duration-150 hover:bg-muted/35 has-aria-expanded:bg-muted/40 data-[state=selected]:bg-primary/5",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      role="columnheader"
      scope="col"
      className={cn(
        "h-12 px-4 text-left align-middle text-[13px] font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      role="cell"
      className={cn(
        "px-4 py-3.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
