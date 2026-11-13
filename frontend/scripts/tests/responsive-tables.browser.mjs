import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"

const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{
  name: "responsive-tables-fixture", configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/__responsive_tables")) return next()
      res.setHeader("Content-Type", "text/html")
      res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/tests/responsive-tables-fixture.jsx"></script></body></html>'))
    })
  },
}] })
let browser
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const role of ["admin", "institution", "learner"]) {
    await page.goto(`${server.resolvedUrls.local[0]}__responsive_tables?role=${role}`)
    await page.evaluate((role) => document.body.classList.toggle("learner-portal", role === "learner"), role)
    await page.waitForSelector('td[data-label="Date joined"]')
    for (const dark of [false, true]) {
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), dark)
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewport({ width, height: 844 })
        const result = await page.evaluate(() => {
          const table = document.querySelector("table")
          const row = table.tBodies[0].rows[0]
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            display: getComputedStyle(table).display,
            cellsFit: [...row.cells].every((cell) => { const r = cell.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth }),
            labels: [...row.cells].map((cell) => cell.dataset.label),
            nativeLabel: document.querySelector('[aria-label="Certification results"] tbody td').dataset.label,
          }
        })
        assert.equal(result.overflow, false, `${role}, dark=${dark}, ${width}: page overflow`)
        if (width < 768) {
          assert.equal(result.display, "block")
          assert.equal(result.cellsFit, true, `${role}, ${width}: all fields fit`)
          assert.deepEqual(result.labels, ["Learner", "Institution", "Type", "Certifications", "Progress", "Status", "Date joined", "Actions"])
          assert.equal(result.nativeLabel, "Certification")
        } else assert.equal(result.display, "table", "desktop keeps table semantics/layout")
      }
    }
  }
  await page.setViewport({ width: 320, height: 844 })
  await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Pagination"] button')].find((node) => node.textContent.trim() === "Next").click())
  await page.waitForFunction(() => document.querySelector("tbody").textContent.includes("Learner 11"))
  await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Pagination"] button')].find((node) => node.textContent.trim() === "Previous").click())
  await page.waitForFunction(() => document.querySelector("tbody").textContent.includes("Learner 01"))
  await page.click('[aria-label="Actions for Learner 01 With a long family name"]')
  await page.waitForSelector('[role="menuitem"]', { visible: true })
  await page.keyboard.press("Escape")
  await page.click('button[aria-label="Sort by Learner"]')
  await page.click('button[aria-label="Sort by Learner"]')
  await page.waitForFunction(() => document.querySelector("tbody").textContent.includes("Learner 80"))
  await page.type('input[placeholder="Search learner, email, or institution"]', "learner1.avery")
  await page.waitForFunction(() => document.querySelector("tbody").rows.length === 1)
  assert.match(await page.$eval("tbody", (el) => el.innerText), /learner1\.avery/)
  await page.click('.rb-table-view-options button:last-child')
  const canScroll = await page.$eval('[data-slot="table-container"]', (node) => {
    node.scrollLeft = node.scrollWidth
    return node.scrollLeft > 0 && node.querySelector("tr:last-child td:last-child").getBoundingClientRect().right <= node.getBoundingClientRect().right + 1
  })
  assert.equal(canScroll, true, "table view can reach the last column")
  await page.click('.rb-table-view-options button:first-child')
  await page.screenshot({ path: "scripts/tests/responsive-tables-mobile.png", fullPage: true })
  assert.deepEqual(errors, [])
  console.log("PASS: real learners table across 320/390/768/1280px, three portal themes, light/dark, all labeled fields, native cells, sorting, filtering, actions, pagination fit, and last-column scrolling.")
} finally { await browser?.close(); await server.close() }
