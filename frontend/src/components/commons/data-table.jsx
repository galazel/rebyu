
import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  Search,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableHead } from "@/components/ui/table"

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export const TABLE_SURFACE = "border border-border/70 shadow-none"

export function TableCard({ className = "", children }) {
  return (
    <div className={`overflow-hidden rounded-rb-card border border-border/70 bg-card ${className}`}>
      {children}
    </div>
  )
}

export function TableToolbar({
  pageSize,
  onPageSizeChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search table field",
  children,
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Show
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-9 w-[74px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            entries
          </label>
        ) : null}

        {children}
      </div>

      {onSearchChange ? (
        <label className="relative w-full lg:max-w-xs">
          <span className="sr-only">{searchPlaceholder}</span>
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pr-9"
          />
          <Search
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </label>
      ) : null}
    </div>
  )
}

export function SortableHead({ column, label, sort, onSort, className = "", align = "left" }) {
  const isActive = sort?.key === column
  const Arrow = !isActive
    ? ChevronsUpDownIcon
    : sort.direction === "asc"
      ? ChevronUpIcon
      : ChevronDown

  return (
    <TableHead className={`${className} ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(column)}

        className={`group inline-flex items-center gap-1 transition-opacity hover:opacity-80 ${
          isActive ? "opacity-100" : "opacity-90"
        } ${align === "right" ? "flex-row-reverse" : ""}`}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <Arrow
          className={`size-3.5 shrink-0 transition-opacity ${
            isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"
          }`}
          aria-hidden="true"
        />
      </button>
    </TableHead>
  )
}

export function PlainHead({ label, className = "", align = "left" }) {
  return (
    <TableHead className={`${className} ${align === "right" ? "text-right" : ""}`}>
      <span className="text-[13px] font-bold uppercase tracking-wide">{label}</span>
    </TableHead>
  )
}

export function useTableSort(initialKey = null, initialDirection = "asc") {
  const [sort, setSort] = useState(
    initialKey ? { key: initialKey, direction: initialDirection } : null
  )

  function toggle(key) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" }
      if (current.direction === "asc") return { key, direction: "desc" }
      return null
    })
  }

  function sortRows(rows, accessors) {
    if (!sort || !accessors?.[sort.key]) return rows

    const read = accessors[sort.key]
    const factor = sort.direction === "asc" ? 1 : -1

    return [...rows].sort((a, b) => {
      const left = read(a)
      const right = read(b)

      if (left == null && right == null) return 0
      if (left == null) return 1
      if (right == null) return -1

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * factor
      }

      return String(left).localeCompare(String(right), undefined, { numeric: true }) * factor
    })
  }

  return { sort, toggle, sortRows }
}

function pageWindow(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const slots = new Set([1, totalPages, page, page - 1, page + 1])
  if (page <= 3) [2, 3, 4].forEach((value) => slots.add(value))
  if (page >= totalPages - 2) {
    [totalPages - 1, totalPages - 2, totalPages - 3].forEach((value) => slots.add(value))
  }

  const pages = [...slots].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)

  const withGaps = []
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) withGaps.push("gap")
    withGaps.push(value)
  })
  return withGaps
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  rangeStart,
  rangeEnd,
  total,
  unit = "entries",
}) {
  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages])

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border/60 px-4 py-4 sm:px-5 md:flex-row md:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-bold text-foreground tabular-nums">{rangeStart}</span>–
        <span className="font-bold text-foreground tabular-nums">{rangeEnd}</span> of{" "}
        <span className="font-bold text-foreground tabular-nums">{total}</span> {unit}
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full px-3"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>

        {pages.map((value, index) =>
          value === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-2 text-sm text-muted-foreground"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              onClick={() => onPageChange(value)}
              aria-current={value === page ? "page" : undefined}
              className={`size-9 rounded-full text-sm font-bold tabular-nums transition-colors ${
                value === page
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {value}
            </button>
          )
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full px-3"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </nav>
    </div>
  )
}
