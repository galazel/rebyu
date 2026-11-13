import JSZip from "jszip"

function escapeXml(value) {
  if (value == null) return ""
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getColLetter(colIndex) {
  let temp = colIndex + 1
  let letter = ""
  while (temp > 0) {
    const mod = (temp - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    temp = Math.floor((temp - 1) / 26)
  }
  return letter
}

function sanitizeSheetName(name, existingNames = new Set()) {
  let clean = String(name || "Sheet")
    .replace(/[\\/?*[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31)
  if (!clean) clean = "Sheet"
  let unique = clean
  let counter = 1
  while (existingNames.has(unique.toLowerCase())) {
    const suffix = ` (${counter})`
    unique = clean.slice(0, 31 - suffix.length) + suffix
    counter++
  }
  existingNames.add(unique.toLowerCase())
  return unique
}

/**
 * Builds an OpenXML spreadsheet (.xlsx) from an array of blocks ({ title, columns, rows }).
 * Combines "About this export" with the first table for a clean overview tab,
 * and gives each remaining section its own dedicated tab with auto-fitted columns
 * and formatted headers.
 */
export function buildXlsxWorkbook(blocks = []) {
  const validBlocks = blocks.filter(Boolean)
  if (validBlocks.length === 0) {
    validBlocks.push({ title: "Export", columns: ["Status"], rows: [["No data available"]] })
  }

  // If the first block is "About this export", combine it with the second block on the overview sheet
  const sheets = []
  const hasAbout = validBlocks[0]?.title?.toLowerCase().includes("about")
  if (hasAbout && validBlocks.length > 1) {
    sheets.push({
      title: "Overview",
      sections: [validBlocks[0], validBlocks[1]],
    })
    for (let i = 2; i < validBlocks.length; i++) {
      sheets.push({
        title: validBlocks[i].title,
        sections: [validBlocks[i]],
      })
    }
  } else {
    for (const b of validBlocks) {
      sheets.push({
        title: b.title || "Sheet",
        sections: [b],
      })
    }
  }

  const zip = new JSZip()

  // [Content_Types].xml
  const sheetOverrides = sheets
    .map(
      (_, i) =>
        `  <Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join("\n")

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheetOverrides}
</Types>`
  )

  // _rels/.rels
  zip.folder("_rels").file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  )

  // xl/_rels/workbook.xml.rels
  const sheetRels = sheets
    .map(
      (_, i) =>
        `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join("\n")

  zip.folder("xl").folder("_rels").file(
    "workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
${sheetRels}
</Relationships>`
  )

  // xl/styles.xml
  // Font 0: regular 11pt, Font 1: bold 11pt, Font 2: bold 13pt title, Font 3: bold 10pt subtitle
  // Fill 2: header light slate (#F1F5F9), Fill 3: subtle meta fill (#F8FAFC)
  // CellXfs:
  // 0: default
  // 1: Section Title (13pt bold)
  // 2: Header cell (11pt bold, slate fill, border)
  // 3: Text cell with border
  // 4: Number cell (right-aligned, border)
  // 5: Center cell (booleans, short dates, border)
  // 6: Meta label cell (10pt bold, subtle fill, border)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Calibri"/><color rgb="FF1E293B"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FF0F172A"/></font>
    <font><b/><sz val="13"/><name val="Calibri"/><color rgb="FF0F172A"/></font>
    <font><b/><sz val="10"/><name val="Calibri"/><color rgb="FF475569"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`
  zip.file("xl/styles.xml", stylesXml)

  // xl/workbook.xml
  const existingNames = new Set()
  const sheetEntries = sheets
    .map((s, i) => {
      const sanitized = sanitizeSheetName(s.title || `Sheet${i + 1}`, existingNames)
      return `    <sheet name="${escapeXml(sanitized)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    })
    .join("\n")

  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheetEntries}
  </sheets>
</workbook>`
  )

  // Generate each worksheet
  sheets.forEach((sheet, sheetIdx) => {
    let maxCols = 1
    for (const sec of sheet.sections) {
      const secCols = Math.max(sec.columns?.length ?? 0, ...(sec.rows ?? []).map((r) => r?.length ?? 0))
      if (secCols > maxCols) maxCols = secCols
    }

    // Measure max content width per column
    const colWidths = Array.from({ length: maxCols }, (_, c) => {
      let maxLen = 10
      for (const sec of sheet.sections) {
        if (sec.columns?.[c]) {
          const l = String(sec.columns[c]).length
          if (l > maxLen) maxLen = l
        }
        for (const row of sec.rows ?? []) {
          if (row?.[c] != null) {
            const l = String(row[c]).length
            if (l > maxLen) maxLen = l
          }
        }
      }
      return Math.min(Math.max(maxLen + 4, 13), 50)
    })

    const colsXml = colWidths
      .map((w, c) => `    <col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`)
      .join("\n")

    let rowIdx = 1
    const rowLines = []

    for (let sIdx = 0; sIdx < sheet.sections.length; sIdx++) {
      const sec = sheet.sections[sIdx]
      if (sIdx > 0) {
        // Empty spacer row between sections on the same sheet
        rowIdx++
      }

      // Section Title
      if (sec.title) {
        rowLines.push(
          `    <row r="${rowIdx}">\n` +
            `      <c r="A${rowIdx}" s="1" t="inlineStr"><is><t>${escapeXml(sec.title)}</t></is></c>\n` +
            `    </row>`
        )
        rowIdx++
      }

      // Column Headers
      if (sec.columns?.length) {
        const headerCells = sec.columns
          .map((colName, c) => {
            const ref = `${getColLetter(c)}${rowIdx}`
            return `      <c r="${ref}" s="2" t="inlineStr"><is><t>${escapeXml(colName)}</t></is></c>`
          })
          .join("\n")
        rowLines.push(`    <row r="${rowIdx}">\n${headerCells}\n    </row>`)
        rowIdx++
      }

      // Rows
      const secColCount = sec.columns?.length || maxCols
      for (const r of sec.rows ?? []) {
        const cells = []
        for (let c = 0; c < secColCount; c++) {
          const val = r?.[c]
          const ref = `${getColLetter(c)}${rowIdx}`
          if (val == null || val === "") {
            cells.push(`      <c r="${ref}" s="3"/>`)
          } else if (typeof val === "number") {
            cells.push(`      <c r="${ref}" s="4"><v>${val}</v></c>`)
          } else if (typeof val === "boolean") {
            cells.push(`      <c r="${ref}" s="5" t="b"><v>${val ? 1 : 0}</v></c>`)
          } else {
            const str = String(val)
            const style = sec.title?.toLowerCase().includes("about") && c === 0 ? "6" : "3"
            cells.push(`      <c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(str)}</t></is></c>`)
          }
        }
        rowLines.push(`    <row r="${rowIdx}">\n${cells.join("\n")}\n    </row>`)
        rowIdx++
      }
    }

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
${colsXml}
  </cols>
  <sheetData>
${rowLines.join("\n")}
  </sheetData>
</worksheet>`

    zip.file(`xl/worksheets/sheet${sheetIdx + 1}.xml`, sheetXml)
  })

  return zip
}

/**
 * Downloads a generated .xlsx file directly in the browser.
 */
export async function downloadXlsx(filename, blocks) {
  const zip = buildXlsxWorkbook(blocks)
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
