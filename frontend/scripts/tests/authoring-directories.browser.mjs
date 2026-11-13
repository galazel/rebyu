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
  for (const route of ["institutions", "partnership-requests", "learners"]) {
    await goto(route)
    await page.waitForSelector("tbody tr td")
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewport({ width, height: 844 })
      for (const dark of [false, true]) {
        await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), dark)
        await fits(route + " at " + width)
      }
    }
    await page.setViewport({ width: 390, height: 844 })
    const input = await page.$('input[placeholder^="Search"]')
    await input.type("no-such-record")
    await page.waitForFunction(() => document.querySelector("tbody").textContent.includes("No "))
    await page.evaluate(() => [...document.querySelectorAll("button")].find((node) => node.textContent.trim() === "Clear filters").click())
    await page.waitForFunction(() => !document.querySelector("tbody").textContent.includes("No "))
    if (route === "learners") {
      assert.equal(await page.$$eval('tbody button', (buttons) => buttons.every((node) => node.textContent.trim() === "Delete")), true)
      await page.click('tbody button[aria-label^="Delete"]')
      await page.waitForSelector('[role="alertdialog"]', { visible: true })
      await page.keyboard.press("Escape")
      await page.waitForSelector('[role="alertdialog"]', { hidden: true })
    }
    if (route === "institutions") {
      assert.equal(await page.$$eval('tbody button', (buttons) => buttons.every((node) => node.textContent.trim() === "View details")), true)
      await page.click('tbody button[aria-label^="View details"]')
      await page.waitForFunction(() => document.body.textContent.includes("Seat utilisation"))
      assert.equal(await page.$$eval('main button', (buttons) => buttons.some((node) => /^(Edit|Delete|Drop|Drop and refund)$/.test(node.textContent.trim()))), false, "institution detail must be read-only")
      await fits("read-only institution details")
      await goto("institutions")
      await page.waitForSelector("tbody td")
    }
    await page.screenshot({ path: "scripts/tests/admin-directory-" + route + ".png", fullPage: true })
  }
  await page.setViewport({ width: 390, height: 844 })
  await goto("certification/1/question-bank?tab=question-builder&mode=manual")
  await page.waitForSelector('button[aria-label="Choose a lesson"]')
  assert.equal(await page.$eval('aside', (el) => getComputedStyle(el).display), "none", "mobile must not show the entire course tree")
  await page.click('button[aria-label="Choose a lesson"]')
  await page.waitForSelector('[aria-label="Search course lessons"]', { visible: true })
  await page.type('[aria-label="Search course lessons"]', "Lesson 099")
  await page.click('[role="dialog"] li button')
  await page.waitForSelector('[role="dialog"]', { hidden: true })
  await page.click('[aria-label="Add question type"]')
  await page.waitForSelector('[role="option"]', { visible: true })
  await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].find((el) => el.textContent.trim() === "Multiple Choice").click())
  await page.waitForSelector('[role="option"]', { hidden: true })
  await page.waitForSelector('textarea[placeholder="Write the question, scenario, or instructions..."]')
  await page.type('textarea[placeholder="Write the question, scenario, or instructions..."]', "A draft that must be preserved")
  await fits("admin question editor")
  await page.click('button[aria-label^="Change lesson:"]')
  await page.type('[aria-label="Search course lessons"]', "Lesson 100")
  await page.click('[role="dialog"] li button')
  await page.waitForFunction(() => document.body.textContent.includes("Unsaved Questions"))
  assert.equal(await page.$eval('textarea[placeholder="Write the question, scenario, or instructions..."]', (el) => el.value), "A draft that must be preserved")
  await page.evaluate(() => [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Okay").click())
  await page.keyboard.press("Escape")
  await page.screenshot({ path: "scripts/tests/question-builder-mobile.png", fullPage: true })
  await page.setViewport({ width: 1280, height: 900 })
  assert.notEqual(await page.$eval('aside', (el) => getComputedStyle(el).display), "none", "desktop course tree preserved")
  for (const role of ["institution", "department"]) {
    await page.setViewport({ width: 320, height: 740 })
    await goto("builder-" + role)
    await page.waitForSelector('button[aria-haspopup="dialog"]:not([aria-label="Open navigation"])')
    await page.click('button[aria-haspopup="dialog"]:not([aria-label="Open navigation"])')
    await page.waitForSelector('[aria-label="Search course lessons"]', { visible: true })
    await page.type('[aria-label="Search course lessons"]', "Lesson 100")
    await page.click('[role="dialog"] li button')
    await page.waitForSelector('[role="dialog"]', { hidden: true })
    await page.evaluate(() => [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Add question").click())
    await page.waitForSelector("#question-text", { visible: true })
    await fits(role + " question form")
    await page.click('[role="dialog"] button[aria-haspopup="dialog"]')
    await page.waitForSelector('[aria-label="Search course lessons"]', { visible: true })
    await page.type('[aria-label="Search course lessons"]', "Lesson 099")
    await page.click('[role="dialog"] li button')
    await page.waitForFunction(() => !document.querySelector('[aria-label="Search course lessons"]'))
    assert.ok(await page.$("#question-text"), "nested chooser must keep the question form open")
    await fits(role + " nested lesson chooser")
  }
  assert.deepEqual(errors, [])
  console.log("PASS: management directories at 320–1280px in both themes, search/reset, Delete-only learners with confirmation; mobile admin builder with 100 lessons, draft protection, desktop structure; institution and department lesson selection/forms.")
} finally { await browser?.close(); await server.close() }
