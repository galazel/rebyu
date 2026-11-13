import { useState } from "react"
import { toast } from "sonner"

import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv.js"
import { hasData, prepareExport } from "@/lib/export-format.js"
import { downloadXlsx } from "@/lib/xlsx.js"
import { cn } from "@/lib/utils"

export {
  cellValue,
  exportedAt,
  sectionsFromPayload,
  tableFromObject,
  tableFromObjects,
} from "@/lib/export-format.js"

export { downloadXlsx } from "@/lib/xlsx.js"

/**
 * Universal export button supporting both formatted Excel (.xlsx) and standard CSV (.csv).
 *
 * `sections` is what `toCsv` / `buildXlsxWorkbook` takes ([{ title, columns, rows }]),
 * or a function returning it — sync or async, so a page can fetch the full data set
 * at click time instead of exporting only what is on screen.
 * `report` names the file's contents and `details` ([label, value] pairs) say
 * what it covers (student, department, period, filters); both go in the "About this
 * export" block.
 */
export function ExportButton({
  filename,
  report,
  details = [],
  sections,
  label = "Export",
  disabled = false,
  size = "sm",
  variant = "outline",
  className = "",
  allowExcel = true,
}) {
  const [busy, setBusy] = useState(false)

  const run = async (format = "xlsx") => {
    setBusy(true)
    try {
      const resolved = typeof sections === "function" ? await sections() : sections
      const scope = typeof details === "function" ? details() : details
      if (!hasData(resolved)) {
        toast.info("There is nothing to export yet.")
        return
      }
      const blocks = prepareExport(report ?? filename.replace(/^rebyu-/, "").replaceAll("-", " "), resolved, scope)
      if (format === "xlsx") {
        await downloadXlsx(timestampedFilename(filename).replace(/\.csv$/, ".xlsx"), blocks)
      } else {
        downloadCsv(timestampedFilename(filename), toCsv(blocks))
      }
    } catch (error) {
      toast.error(error?.response?.data?.message ?? error?.message ?? "The export could not be prepared.")
    } finally {
      setBusy(false)
    }
  }

  if (!allowExcel) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => run("csv")}
        disabled={disabled || busy}
        className={cn("gap-1.5", className)}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
        {label}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled || busy}
          className={cn("gap-1.5", className)}
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
          <span>{label}</span>
          <ChevronDown className="size-3.5 opacity-60 ml-0.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem
          onClick={() => run("xlsx")}
          className="cursor-pointer gap-2.5 py-2"
        >
          <FileSpreadsheet className="size-4 text-emerald-600" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Excel Workbook (.xlsx)</span>
            <span className="text-[11px] text-muted-foreground">Formatted with auto-width columns</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => run("csv")}
          className="cursor-pointer gap-2.5 py-2"
        >
          <FileText className="size-4 text-sky-600" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">CSV File (.csv)</span>
            <span className="text-[11px] text-muted-foreground">Standard comma-separated text</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The button's work without the button — for menu items. Returns false when there was nothing to export. */
export async function downloadExport({ filename, report, details = [], sections, format = "csv" }) {
  const resolved = typeof sections === "function" ? await sections() : sections
  if (!hasData(resolved)) {
    toast.info("There is nothing to export yet.")
    return false
  }
  const scope = typeof details === "function" ? details() : details
  const blocks = prepareExport(report ?? filename, resolved, scope)
  if (format === "xlsx") {
    await downloadXlsx(timestampedFilename(filename).replace(/\.csv$/, ".xlsx"), blocks)
  } else {
    downloadCsv(timestampedFilename(filename), toCsv(blocks))
  }
  return true
}

/** Runs `task` over `items` with at most `limit` running at once (fetching per learner). */
export async function mapLimit(items, limit, task) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      try {
        results[index] = await task(items[index], index)
      } catch {
        results[index] = null
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export function isoDay(value) {
  return value ? String(value).slice(0, 10) : ""
}

/** A whole-number percentage, or blank. */
export function pct(value) {
  return value == null || value === "" || !Number.isFinite(Number(value)) ? null : Math.round(Number(value))
}
