
function cell(value) {
  if (value == null) return ""
  const text = String(value)
  if (text === "—") return ""
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function row(values) {
  return values.map(cell).join(",")
}

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

export function timestampedFilename(prefix) {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
  return `${prefix}-${stamp}.csv`
}
