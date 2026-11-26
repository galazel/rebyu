// Renders rebyu-chen-erd.svg to PDF on SHORT BOND (8.5 x 11 in), LANDSCAPE,
// with 1 inch margins on every side -> a 9.0 x 6.5 in live area.
//
//   rebyu-chen-erd-1page.pdf   whole diagram scaled onto one page
//   rebyu-chen-erd-4page.pdf   same diagram tiled 2 x 2 across four pages
//
// Nothing is duplicated between tiles: the 4-page file is one diagram cut on
// straight lines, with an overlap band so a connector crossing a cut is
// visible on both sheets.
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
const require = createRequire("C:/Users/galazel/IdeaProjects/capstone/frontend/package.json")
const { chromium } = require("playwright")

const DIR = "C:/Users/galazel/IdeaProjects/capstone/test-evidence/erd"
const svg = readFileSync(`${DIR}/rebyu-chen-erd.svg`, "utf8")
const W = Number(svg.match(/width="(\d+)"/)[1])
const H = Number(svg.match(/height="(\d+)"/)[1])

const DPI = 96
const PAGE_W = 11 * DPI, PAGE_H = 8.5 * DPI       // landscape short bond
const LIVE_W = 9 * DPI, LIVE_H = 6.5 * DPI        // 1 inch margins all round
const OVERLAP = 40                                 // svg units shared across a cut

const css = `
  @page { size: 11in 8.5in; margin: 1in; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page { width: ${LIVE_W}px; height: ${LIVE_H - 2}px; overflow: hidden;
          position: relative; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .vp { position: absolute; left: 0; top: 0; }
  .tag { position: absolute; right: 2px; bottom: 2px; font: 11px "Times New Roman", serif;
         color: #555; }
`

function sheet(sx, sy, sw, sh, scale, label) {
  // one live area showing the svg rectangle (sx, sy, sw, sh) at `scale`
  const dx = (LIVE_W - sw * scale) / 2 - sx * scale
  const dy = (LIVE_H - sh * scale) / 2 - sy * scale
  return `<div class="page"><div class="vp" style="
      width:${W}px; height:${H}px;
      transform: translate(${dx}px, ${dy}px) scale(${scale});
      transform-origin: 0 0;">${svg}</div>${
      label ? `<div class="tag">${label}</div>` : ""}</div>`
}

const onePageScale = Math.min(LIVE_W / W, LIVE_H / H)
const onePage = `<style>${css}</style>` + sheet(0, 0, W, H, onePageScale, "")

const COLS = 2, ROWS = 2
const tw = W / COLS, th = H / ROWS
const tileScale = Math.min(LIVE_W / (tw + 2 * OVERLAP), LIVE_H / (th + 2 * OVERLAP))
let tiles = ""
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) {
    const sx = Math.max(0, c * tw - OVERLAP), sy = Math.max(0, r * th - OVERLAP)
    const ex = Math.min(W, (c + 1) * tw + OVERLAP), ey = Math.min(H, (r + 1) * th + OVERLAP)
    tiles += sheet(sx, sy, ex - sx, ey - sy, tileScale,
      `sheet ${r * COLS + c + 1} of ${ROWS * COLS} &mdash; ` +
      `${r === 0 ? "top" : "bottom"} ${c === 0 ? "left" : "right"}`)
  }
const fourPage = `<style>${css}</style>` + tiles

const b = await chromium.launch({ channel: "msedge" })
const p = await b.newPage()
for (const [name, body, note] of [
  ["rebyu-chen-erd-1page.pdf", onePage, onePageScale],
  ["rebyu-chen-erd-4page.pdf", fourPage, tileScale],
]) {
  await p.setContent(`<!doctype html><html><body>${body}</body></html>`,
                     { waitUntil: "load" })
  await p.pdf({ path: `${DIR}/${name}`, width: `${PAGE_W}px`, height: `${PAGE_H}px`,
                margin: { top: "1in", right: "1in", bottom: "1in", left: "1in" },
                printBackground: true, preferCSSPageSize: false })
  console.log(`${name}: scale ${note.toFixed(4)} -> 22pt prints at ` +
              `${(22 * note * 72 / DPI).toFixed(1)}pt`)
}
await b.close()
console.log(`svg ${W} x ${H}; live area ${LIVE_W} x ${LIVE_H} px @ ${DPI}dpi`)
