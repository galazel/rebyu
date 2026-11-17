import { createRequire } from "node:module"
const require = createRequire("C:/Users/galazel/IdeaProjects/capstone/frontend/package.json")
const { chromium } = require("playwright")
const b = await chromium.launch({ channel: "msedge" })
const p = await b.newPage({ viewport: { width: 2830, height: 1711 }, deviceScaleFactor: 3 })
await p.goto("file:///C:/Users/galazel/IdeaProjects/capstone/test-evidence/erd/rebyu-chen-erd.svg")
await p.screenshot({ path: "C:/Users/galazel/IdeaProjects/capstone/test-evidence/erd/rebyu-chen-erd.png" })
await b.close()
