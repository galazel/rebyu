import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
import { ai, live, alternative } from "./admin-mobile-data.mjs"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const mocks = ["/src/context/auth-context.jsx", "/src/hooks/use-notifications.js", "/src/hooks/use-avatar-url.js", "/src/components/question-bank/tagging-job-watcher.jsx"]
globalThis.__dirname = root
const server = await createServer({ configLoader: "native", root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{
  name: "admin-mobile", enforce: "pre", resolveId(id) {
    const normalized = id.replaceAll("\\", "/").replace("@/", "/src/")
    if (mocks.some((mock) => normalized.endsWith(mock))) return fileURLToPath(new URL("./admin-sidebar-mocks.js", import.meta.url))
  }, configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/__admin_mobile")) return next()
      res.setHeader("Content-Type", "text/html")
      res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/tests/admin-mobile-fixture.jsx"></script></body></html>'))
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
  await page.setRequestInterception(true)
  page.on("request", (req) => {
    if (!req.url().includes("/api/")) return req.continue()
    return req.respond({ status: 200, contentType: "application/json", body: "[]" })
  })
  const goto = async (route) => {
    await page.goto(server.resolvedUrls.local[0] + "__admin_mobile?page=" + encodeURIComponent(route))
    await page.waitForSelector("main[data-route-content]")
  }
  const fits = async (label) => {
    const bad = await page.evaluate(() => [...document.querySelectorAll('main input, main textarea, main button, main [role="combobox"], [role="dialog"] button, [role="dialog"] input')].filter((el) => {
      if (!el.getClientRects().length) return false
      const tableRegion = el.closest('[data-slot="table-container"]')
      if (tableRegion && tableRegion.scrollWidth > tableRegion.clientWidth) return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1)
    }).map((el) => el.tagName + ": " + el.textContent.slice(0, 50)))
    assert.deepEqual(bad, [], label)
  }
  await goto("subscriptions")
  await page.waitForFunction(() => document.body.textContent.includes("No payments are waiting"))
  for (const tab of ["Pro subscriptions", "All payments", "Certification purchases", "Awaiting approval"]) {
    await page.evaluate(label => [...document.querySelectorAll('[role="tab"]')].find(el => el.textContent.trim() === label).click(), tab)
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewport({width, height:844})
      for (const dark of [false, true]) {
        await page.evaluate(dark => document.documentElement.classList.toggle("dark", dark), dark)
        await fits(tab + " " + width)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, "page overflow")
      }
    }
  }
  await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].find(el => el.textContent.trim() === "All payments").click())
  await page.type('[aria-label="Search payments"]', 'no-such-payment')
  await page.waitForFunction(() => document.body.textContent.includes("No payments match"))
  await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === "Clear filters").click())
  await page.waitForSelector('tbody td')
  await goto("institutions/1")
  await page.waitForFunction(() => document.body.textContent.includes("Seat utilisation"))
  assert.equal(await page.evaluate(() => document.body.textContent.includes("1 enrolment across certifications")), true, "revoked learners excluded")
  assert.equal(await page.evaluate(() => document.body.textContent.includes("50%")), true, "revoked progress excluded")
  assert.deepEqual(errors, [])
  console.log("Payments: four tabs, 320–1280px, light/dark, search/reset passed")
} finally { await browser?.close(); await server.close() }
