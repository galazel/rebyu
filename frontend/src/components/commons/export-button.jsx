import { useState } from "react"
import { toast } from "sonner"

import { Download, Loader2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv.js"
import { hasData, prepareExport } from "@/lib/export-format.js"
import { cn } from "@/lib/utils"

export {
  cellValue,
  exportedAt,
  sectionsFromPayload,
  tableFromObject,
  tableFromObjects,
} from "@/lib/export-format.js"

/**
 * One "Export CSV" button for every portal.
 *
 * `sections` is what `toCsv` takes ([{ title, columns, rows }]), or a function
 * returning it — sync or async, so a page can fetch the full data set (every
 * page, every row) at click time instead of exporting only what is on screen.
 * `report` names the file's contents and `details` ([label, value] pairs) say
 * what it covers (department, period, filters); both go in the "About this
 * export" block every file opens with. Every cell is normalised the same way.
 */
export function ExportButton({
  filename,
  report,
  details = [],
  sections,
  label = "Export CSV",
  disabled = false,
  size = "sm",
  variant = "outline",
  className = "",
}) {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const resolved = typeof sections === "function" ? await sections() : sections
      const scope = typeof details === "function" ? details() : details
      if (!hasData(resolved)) {
        toast.info("There is nothing to export yet.")
        return
      }
      const blocks = prepareExport(report ?? filename.replace(/^rebyu-/, "").replaceAll("-", " "), resolved, scope)
      downloadCsv(timestampedFilename(filename), toCsv(blocks))
    } catch (error) {
      toast.error(error?.response?.data?.message ?? error?.message ?? "The export could not be prepared.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={run}
      disabled={disabled || busy}
      className={cn("gap-1.5", className)}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
      {label}
    </Button>
  )
}

/** The button's work without the button — for menu items. Returns false when there was nothing to export. */
export async function downloadExport({ filename, report, details = [], sections }) {
  const resolved = typeof sections === "function" ? await sections() : sections
  if (!hasData(resolved)) {
    toast.info("There is nothing to export yet.")
    return false
  }
  const scope = typeof details === "function" ? details() : details
  downloadCsv(timestampedFilename(filename), toCsv(prepareExport(report ?? filename, resolved, scope)))
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
