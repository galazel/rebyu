import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"

const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "skim-fixture", configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__skim_test") return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, '<html><body><div id="root"></div><script type="module" src="/scripts/tests/skim-guard-fixture.jsx"></script></body></html>'))
  })
} }] })
let browser
let creates = 0
const releaseChecks = []
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    if (request.url().endsWith("/knowledge-checks") && request.method() === "POST") {
      creates++
      releaseChecks.push(() => request.respond({ status: 200, contentType: "application/json", body: '{"examId":42}' }))
      return
    }
    if (request.url().includes("/attempts")) return request.respond({ status: 200, contentType: "application/json", body: '{"assessmentAttemptId":99}' })
    if (request.url().endsWith("/key")) return request.respond({ status: 200, contentType: "application/json", body: '[]' })
    request.continue()
  })
  await page.goto(`${server.resolvedUrls.local[0]}__skim_test`)
  await page.waitForFunction(() => window.skimFixture)
  await new Promise((resolve) => setTimeout(resolve, 2600))
  async function scroll(target) {
    await page.evaluate(async (target) => {
      for (let n = 0; n < 9; n++) {
        if (target) document.querySelector(target).dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: 220 }))
        window.scrollBy(0, 220)
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }
    }, target)
  }
  async function scrollSlowly(target) {
    await page.evaluate(async (target) => {
      for (let n = 0; n < 7; n++) {
        document.querySelector(target).dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: 120 }))
        window.scrollBy(0, 120)
        await new Promise((resolve) => setTimeout(resolve, 220))
      }
    }, target)
  }
  await scroll(null)
  await scroll("#chat")
  await scroll("#draft")
  await scroll("#nested-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 0, "programmatic, chat, input and nested scrolling must not count")
  await scrollSlowly("#lesson-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 0, "deliberate lesson reading must not count as skimming")
  await scroll("#lesson-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 1)
  for (let n = 0; n < 50 && creates < 1; n++) await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(creates, 1, "a rapid scroll immediately challenges the current lesson")
  await releaseChecks.shift()()
  await page.waitForFunction(() => window.skimFixture.offer)
  await page.goto(`${server.resolvedUrls.local[0]}__skim_test`)
  await page.waitForFunction(() => window.skimFixture?.offer, { timeout: 5000 })
  assert.equal(creates, 1, "refreshing restores the active challenge without creating another one")

  await page.evaluate(() => window.skimFixture.dismiss())
  await page.waitForFunction(() => !window.skimFixture.offer)
  await scroll("#lesson-text")
  await page.waitForFunction(() => window.skimFixture.warningOpen)
  assert.equal(creates, 1, "a second rapid scroll warns instead of creating another challenge")
  await page.evaluate(() => window.skimFixture.dismissWarning())

  await page.evaluate(() => window.skimFixture.setLesson(2))
  await page.waitForFunction(() => window.skimFixture)
  await page.evaluate(async () => {
    window.scrollTo(0, 0)
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    window.dispatchEvent(new MouseEvent("mousedown", { clientX: document.documentElement.clientWidth + 1 }))
    for (let n = 0; n < 9; n++) {
      window.scrollBy(0, 220)
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    }
    window.dispatchEvent(new MouseEvent("mouseup"))
  })
  for (let n = 0; n < 50 && creates < 2; n++) await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 2, "fast scrollbar dragging must count as skimming")
  assert.equal(creates, 2, "each lesson can trigger its own challenge")
  await releaseChecks.shift()()
  console.log("PASS: page-only fast gestures trigger once per lesson, then warns; scrollbar dragging also triggers per lesson.")
} finally { await browser?.close(); await server.close() }
