/**
 * CSV writing for the "export what is on this screen" buttons.
 *
 * Deliberately small: a dashboard export is read by a spreadsheet, not by a
 * parser we control, so the job is to be boring and correct about quoting
 * rather than to be a CSV library.
 */

/**
 * One cell, quoted only when it has to be.
 *
 * `null`/`undefined` become an empty cell rather than the string "null". The
 * dashboard already distinguishes "nothing happened" from "we could not work
 * it out" by showing a dash; carrying a dash into a numeric column would make
 * the column text in Excel, so an unknown is simply left blank.
 */
function cell(value) {
  if (value == null) return ""
  const text = String(value)
  if (text === "—") return ""
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function row(values) {
  return values.map(cell).join(",")
}

/**
 * Several titled tables in one file, separated by a blank line.
 *
 * A dashboard is not one table -- it is counters, a monthly series and a few
 * feeds -- and flattening all of it into a single shape loses which number
 * belongs to what. Spreadsheets open a sectioned file like this without
 * complaint, and a human reading it gets the same grouping they saw on screen.
 *
 * @param {{title?: string, columns?: string[], rows?: Array<Array<unknown>>}[]} sections
 */
export function toCsv(sections) {
  const blocks = []
  for (const section of sections) {
    if (!section) continue
    const lines = []
    if (section.title) lines.push(row([section.title]))
    if (section.columns?.length) lines.push(row(section.columns))
    for (const values of section.rows ?? []) lines.push(row(values))
    if (lines.length) blocks.push(lines.join("\r\n"))
  }
  return blocks.join("\r\n\r\n")
}

/**
 * Hand the file to the browser.
 *
 * The BOM is what makes Excel read the file as UTF-8; without it a learner
 * named "José" arrives mojibake'd, which is the kind of bug that only ever
 * shows up on someone else's machine.
 */
export function downloadCsv(filename, content) {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** `rebyu-admin-dashboard-2026-09-21.csv` -- sortable, and says what it is. */
export function timestampedFilename(prefix) {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
  return `${prefix}-${stamp}.csv`
}
