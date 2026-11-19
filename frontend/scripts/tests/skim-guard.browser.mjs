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
  // Returning to the top is itself a movement of several screens, and it lands
  // straight after the previous case's scrolling. Go quiet first so the jump is
  // not measured against that reading, then quiet again so the jump itself has
  // left the measurement window before the scroll under test begins.
  async function startFromTop() {
    await page.evaluate(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      window.scrollTo(0, 0)
      await new Promise((resolve) => setTimeout(resolve, 1200))
    })
  }

  async function scroll(target) {
    await page.evaluate(async (target) => {
      for (let n = 0; n < 16; n++) {
        if (target) document.querySelector(target).dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: 260 }))
        window.scrollBy(0, 260)
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }
    }, target)
  }

  // Brisk reading: real wheel gestures, several screens' worth, but not the
  // runaway pace a skim is. This is the case that used to raise a challenge.
  async function scrollBriskly(target) {
    await page.evaluate(async (target) => {
      for (let n = 0; n < 6; n++) {
        document.querySelector(target).dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: 220 }))
        window.scrollBy(0, 220)
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }
    }, target)
  }

  // One big jump: a nudge of the scrollbar, or End on a long lesson. Lots of
  // travel, one movement -- navigation, not skimming.
  async function jumpOnce(target) {
    await page.evaluate(async (target) => {
      document.querySelector(target).dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: 6000 }))
      window.scrollBy(0, 6000)
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
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
  await startFromTop()
  await scroll(null)
  await startFromTop()
  await scroll("#chat")
  await startFromTop()
  await scroll("#draft")
  await startFromTop()
  await scroll("#nested-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 0, "programmatic, chat, input and nested scrolling must not count")
  await startFromTop()
  await scrollSlowly("#lesson-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 0, "deliberate lesson reading must not count as skimming")
  await startFromTop()
  await scrollBriskly("#lesson-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 0, "brisk reading must not count as skimming")
  await startFromTop()
  await jumpOnce("#lesson-text")
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 0, "one long jump is navigation, not skimming")
  await startFromTop()
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
  await startFromTop()
  await scroll("#lesson-text")
  assert.equal(
    await page.evaluate(() => window.skimFixture.warningOpen),
    false,
    "inside the cooldown, skimming again says nothing at all"
  )
  assert.equal(creates, 1, "and it certainly does not build a second challenge")

  // Once the cooldown has passed, skimming again is a reminder rather than
  // another challenge.
  await page.evaluate(() => localStorage.removeItem("rebyu:skim-challenge:cooldown:v2:9"))
  await startFromTop()
  await scroll("#lesson-text")
  await page.waitForFunction(() => window.skimFixture.warningOpen)
  assert.equal(creates, 1, "a later rapid scroll warns instead of creating another challenge")
  await page.evaluate(() => window.skimFixture.dismissWarning())

  await page.evaluate(() => localStorage.removeItem("rebyu:skim-challenge:cooldown:v2:9"))
  await page.evaluate(() => window.skimFixture.setLesson(2))
  await page.waitForFunction(() => window.skimFixture)
  await startFromTop()
  await page.evaluate(async () => {
    window.dispatchEvent(new MouseEvent("mousedown", { clientX: document.documentElement.clientWidth + 1 }))
    for (let n = 0; n < 16; n++) {
      window.scrollBy(0, 260)
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    }
    window.dispatchEvent(new MouseEvent("mouseup"))
  })
  for (let n = 0; n < 50 && creates < 2; n++) await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(await page.evaluate(() => window.skimFixture.rushes), 3, "fast scrollbar dragging must count as skimming")
  assert.equal(creates, 2, "each lesson can raise its own challenge")
  await releaseChecks.shift()()
  console.log("PASS: brisk reading and single long jumps are left alone; only a sustained fast scroll triggers, once per lesson; the cooldown then stays silent, and warns after it lapses; fast scrollbar dragging still counts.")
} finally { await browser?.close(); await server.close() }
