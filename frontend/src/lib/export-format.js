/*
 * The one set of rules every CSV export follows, so a file from the dashboard,
 * the roster or the admin pages reads the same way:
 *   - every file opens with an "About this export" block (report, exported at, scope);
 *   - yes/no for booleans, "YYYY-MM-DD" for dates, "YYYY-MM-DD HH:mm" for times;
 *   - numbers keep at most one decimal place;
 *   - lists of named things are joined with " / ", other objects are spelled out.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/

function pad(n) {
  return String(n).padStart(2, "0")
}

export function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`
}

export function exportedAt(now = new Date()) {
  return formatDateTime(now)
}

export function humanize(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
}

/** One cell, in the shared format. */
export function cellValue(value) {
  if (value == null) return ""
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ""
    return Number.isInteger(value) ? value : Math.round(value * 10) / 10
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : formatDateTime(value)
  if (typeof value === "string") {
    if (ISO_DATE.test(value)) return value
    const match = ISO_DATE_TIME.exec(value)
    if (match) {
      // Timestamps with a zone are shown in the reader's local time; zone-less
      // server times (LocalDateTime) are already local.
      if (match[6]) {
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? value : formatDateTime(date)
      }
      return `${match[1]} ${match[2]}:${match[3]}`
    }
    return value
  }
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === "object" ? item.title ?? item.name ?? item.label ?? describe(item) : cellValue(item)
      )
      .join(" / ")
  }
  if (typeof value === "object") return describe(value)
  return value
}

function describe(object) {
  return Object.entries(object)
    .filter(([, v]) => v != null && typeof v !== "object")
    .map(([k, v]) => `${humanize(k)}: ${cellValue(v)}`)
    .join("; ")
}

/** A CSV section from a list of API objects: one column per field. */
export function tableFromObjects(title, list, { omit = [] } = {}) {
  const items = Array.isArray(list) ? list : []
  const keys = []
  for (const item of items) {
    for (const key of Object.keys(item ?? {})) {
      if (!keys.includes(key) && !omit.includes(key)) keys.push(key)
    }
  }
  return { title, columns: keys.map(humanize), rows: items.map((item) => keys.map((key) => item?.[key])) }
}

/** A two-column Metric / Value section from one object. */
export function tableFromObject(title, object, { omit = [] } = {}) {
  return {
    title,
    columns: ["Metric", "Value"],
    rows: Object.entries(object ?? {})
      .filter(([key]) => !omit.includes(key))
      .map(([key, value]) => [humanize(key), value]),
  }
}

/** Every field of a payload: scalars in one table, each list or nested object its own. */
export function sectionsFromPayload(title, payload) {
  if (Array.isArray(payload)) return [tableFromObjects(title, payload)]
  const scalars = {}
  const sections = []
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (Array.isArray(value) && value.some((item) => item && typeof item === "object")) {
      sections.push(tableFromObjects(`${title} — ${humanize(key)}`, value))
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sections.push(tableFromObject(`${title} — ${humanize(key)}`, value))
    } else {
      scalars[key] = value
    }
  }
  return [tableFromObject(title, scalars), ...sections]
}

/** The block every export opens with. `details` are [label, value] pairs (scope, period, filters). */
export function aboutBlock(report, details = [], now = new Date()) {
  return {
    title: "About this export",
    columns: ["Field", "Value"],
    rows: [["Report", report], ["Exported at", exportedAt(now)], ...details.filter((d) => d && d[1] != null && d[1] !== "")],
  }
}

/** Blocks ready for toCsv: the About block first, every cell normalised, empty blocks dropped. */
export function prepareExport(report, blocks, details = [], now = new Date()) {
  const body = (blocks ?? [])
    .filter(Boolean)
    .map((block) => ({
      ...block,
      rows: (block.rows ?? []).map((row) => row.map(cellValue)),
    }))
    .filter((block) => block.rows.length > 0 || (block.columns?.length && block.title))
  return [aboutBlock(report, details, now), ...body]
}

export function hasData(blocks) {
  return (blocks ?? []).some((block) => block && (block.rows?.length ?? 0) > 0)
}
