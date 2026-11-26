// Rasterises rebyu-chen-erd.svg to rebyu-chen-erd.png at 1:1.
// Reads the canvas size out of the SVG so it can never drift from build_erd.py.
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
const require = createRequire("C:/Users/galazel/IdeaProjects/capstone/frontend/package.json")
const { chromium } = require("playwright")

const DIR = "C:/Users/galazel/IdeaProjects/capstone/test-evidence/erd"
const svg = readFileSync(`${DIR}/rebyu-chen-erd.svg`, "utf8")
const width = Number(svg.match(/width="(\d+)"/)[1])
const height = Number(svg.match(/height="(\d+)"/)[1])

const b = await chromium.launch({ channel: "msedge" })
const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
await p.goto(`file:///${DIR}/rebyu-chen-erd.svg`)
await p.screenshot({ path: `${DIR}/rebyu-chen-erd.png` })
await b.close()
console.log(`png ${width} x ${height}`)
