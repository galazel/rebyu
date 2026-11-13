import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
import { ai, live, alternative } from "./admin-mobile-data.mjs"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const mocks = ["/src/context/auth-context.jsx", "/src/hooks/use-notifications.js", "/src/hooks/use-avatar-url.js", "/src/components/question-bank/tagging-job-watcher.jsx"]
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{
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
  let savedModel
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setRequestInterception(true)
  page.on("request", (req) => {
    if (!req.url().includes("/api/")) return req.continue()
    let data = []
    if (req.url().endsWith("/ai/settings")) data = ai
    if (req.url().endsWith("/ai/settings/live-tutor")) data = live
    if (req.url().endsWith("/ai/settings/tutor")) { savedModel = JSON.parse(req.postData()); data = {} }
    return req.respond({ status: 200, contentType: "application/json", body: JSON.stringify(data) })
  })
  const fits = async (description) => {
    const bad = await page.evaluate(() => [...document.querySelectorAll('main button, main input, main select, main [role="combobox"], main article, main fieldset')].filter((el) => {
      if (!el.getClientRects().length) return false
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
    }).map((el) => `${el.tagName}: ${el.textContent.slice(0, 70)}`))
    assert.deepEqual(bad, [], description)
  }
  for (const route of ["ai-settings", "rewards", "lessons/test/create"]) {
    await page.goto(`${server.resolvedUrls.local[0]}__admin_mobile?page=${route}`)
    await page.waitForSelector("main[data-route-content]")
    for (const width of [320, 390, 640, 768, 1280]) {
      await page.setViewport({ width, height: 740 })
      for (const dark of [false, true]) {
        await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), dark)
        await fits(`${route}, ${width}px, dark=${dark}`)
      }
    }
    await page.setViewport({ width: 320, height: 568 })
    if (route.includes("lessons")) {
      await page.click('[aria-label="Lesson elements and outline"]')
      await page.waitForSelector('#lesson-elements-panel', { visible: true })
      await fits("mobile lesson panel")
    }
  }
  await page.goto(`${server.resolvedUrls.local[0]}__admin_mobile`)
  await page.waitForSelector('[aria-label^="Model for"]')
  await page.evaluate(() => document.querySelector('main li > button[aria-expanded="false"]')?.click())
  await page.waitForFunction(() => document.body.textContent.includes("Last error:"))
  await fits("expanded provider error details")
  await page.click('[aria-label^="Model for"]')
  await page.waitForSelector('[role="option"]', { visible: true })
  const popup = await page.$eval('[data-slot="select-content"]', (el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth })
  assert.ok(popup, "model list fits viewport")
  await page.click('[role="option"]')
  await page.evaluate(() => [...document.querySelectorAll("button")].find((el) => el.textContent.includes("Use this model")).click())
  await page.waitForFunction(() => ![...document.querySelectorAll("button")].find((el) => el.textContent.includes("Use this model")).textContent.includes("Saving"))
  assert.equal(savedModel?.model, alternative)
  await page.click('[aria-label="Open navigation"]')
  await page.waitForSelector('[aria-label="Mobile portal navigation"]', { visible: true })
  assert.equal(await page.$$eval('[aria-label="Mobile portal navigation"] a', (els) => els.length), 14)
  await page.$eval('[aria-label="Mobile portal navigation"]', (el) => { el.scrollTop = el.scrollHeight })
  await page.click('[aria-label="Mobile portal navigation"] a[href="/admin/ai-settings"]')
  await page.waitForSelector('[aria-label="Mobile portal navigation"]', { hidden: true })
  await page.evaluate(() => { document.documentElement.classList.add("dark"); window.scrollTo(0, 0) })
  await page.screenshot({ path: "scripts/tests/admin-ai-mobile.png", fullPage: true })
  await page.goto(`${server.resolvedUrls.local[0]}__admin_mobile?page=learner-menu`)
  await page.waitForSelector('[aria-label="Open learner drawer"]')
  await page.click('[aria-label="Open learner drawer"]')
  await page.waitForSelector('[data-mobile="true"]', { visible: true })
  await page.click('[data-mobile="true"] [aria-label="Open account menu"]')
  await page.waitForSelector('[role="menu"]', { visible: true })
  const accountFits = await page.$eval('[role="menu"]', (el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight })
  assert.ok(accountFits, "learner account menu stays inside phone viewport")
  assert.deepEqual(errors, [])
  console.log("PASS: AI settings, rewards and lesson editor at 320–1280px, light/dark, mobile lesson tools, model dropdown/save, and complete scrollable admin navigation.")
} finally { await browser?.close(); await server.close() }
