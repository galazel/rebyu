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
let releaseCheck
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    if (request.url().endsWith("/knowledge-checks") && request.method() === "POST") {
      creates++
      releaseCheck = () => request.respond({ status: 200, contentType: "application/json", body: '{"examId":42}' })
      return
    }
    if (request.url().includes("/attempts") || request.url().endsWith("/key")) return request.respond({ status: 200, contentType: "application/json", body: '{}' })
    request.continue()
  })
  await page.goto(`${server.resolvedUrls.local[0]}__skim_test`)
  await page.waitForFunction(() => window.skimFixture)
  await page.evaluate(() => { localStorage.setItem("rebyu:skim-strikes:9", "[90,91]"); sessionStorage.clear() })
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
  await scroll(null)
  await scroll("#chat")
  await scroll("#draft")
  await scroll("#nested-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 0, "programmatic, chat, input and nested scrolling must not count")
  await scroll("#lesson-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 1)
  assert.equal(creates, 0, "old permanent strikes must not trigger the first lesson")
  await page.evaluate(() => window.skimFixture.trigger())
  assert.equal(creates, 0)
  await page.evaluate(() => window.skimFixture.setLesson(2))
  await page.waitForFunction(() => window.skimFixture)
  await page.evaluate(() => window.skimFixture.trigger())
  assert.equal(creates, 0, "second distinct lesson must not trigger")
  await page.evaluate(() => window.skimFixture.setLesson(3))
  await new Promise((resolve) => setTimeout(resolve, 50))
  await page.evaluate(() => window.skimFixture.trigger())
  for (let n = 0; n < 50 && !releaseCheck; n++) await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(creates, 1, "third distinct lesson triggers exactly once")
  await page.evaluate(() => window.skimFixture.setEnabled(false))
  await new Promise((resolve) => setTimeout(resolve, 50))
  await releaseCheck()
  await new Promise((resolve) => setTimeout(resolve, 150))
  assert.equal(await page.evaluate(() => window.skimFixture.offer), null, "a stale result cannot reopen a disabled challenge")
  console.log("PASS: page-only gestures, legacy strike exclusion, three distinct lessons, repeated-event deduplication and stale-request suppression.")
} finally { await browser?.close(); await server.close() }
