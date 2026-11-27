import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"

const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((path) => path && existsSync(path))
const route = "/__learner_dashboard_test"
const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 0, hmr: false },
  plugins: [{
    name: "learner-dashboard-layout-fixture",
    configureServer(vite) {
      vite.middlewares.use(async (request, response, next) => {
        if (request.url?.split("?")[0] !== route) return next()
        response.setHeader("Content-Type", "text/html")
        response.end(await vite.transformIndexHtml(route, '<html><body><div id="root"></div><script type="module">import("/scripts/tests/learner-dashboard-layout-fixture.jsx")</script></body></html>'))
      })
    },
  }],
})

let browser
let saved = [
  { id: "todays-plan", x: 0, y: 0, w: 2, h: 3 },
  { id: "exam-readiness", x: 2, y: 0, w: 1, h: 4 },
  { id: "player-card", x: 3, y: 0, w: 3, h: 3 },
  { id: "exam-countdown", x: 2, y: 4, w: 1, h: 3 },
]
let failSave = true
let saveAttempts = 0
let heldAnalytics = Promise.withResolvers()
let heldBehavior = Promise.withResolvers()
const scoreTrend = Array.from({ length: 12 }, (_, index) => {
  const examId = index + 1
  return Array.from({ length: 12 - index }, (_, attempt) => ({
    examId,
    assessmentTitle: `Sample assessment ${examId}`,
    attemptNumber: attempt + 1,
    submittedAt: new Date(Date.UTC(2026, 0, examId, attempt)).toISOString(),
    percentage: 40 + attempt,
  }))
}).flat()

try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  page.on("pageerror", (error) => console.error(error))
  await page.setViewport({ width: 1600, height: 1000 })
  page.setDefaultTimeout(60000)
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    const { hostname, pathname, protocol } = new URL(request.url())
    if (protocol === "https:" && hostname !== "127.0.0.1") return request.abort()
    if (!pathname.startsWith("/api/")) return request.continue()
    const respond = (data, status = 200) => request.respond({
      status, contentType: "application/json", body: JSON.stringify(data),
    })
    if (pathname.endsWith("/study-desk/dashboard-layout")) {
      if (request.method() === "PUT") {
        saveAttempts++
        if (failSave) return respond({}, 503)
        saved = JSON.parse(request.postData()).tiles.map((tile) => ({ ...tile, hidden: null }))
      }
      return respond({ tiles: saved })
    }
    if (pathname.endsWith("/progress-analytics")) {
      const sendAnalytics = () => respond({ readiness: 8, scoreTrend })
      if (heldAnalytics) {
        heldAnalytics.resolve(sendAnalytics)
        return
      }
      return sendAnalytics()
    }
    if (pathname.endsWith("/study-behavior")) {
      const sendBehavior = () => respond({
        rushEvents: 3,
        focusConsistency: 64,
        readingPace: "Rushed",
        challengeCompletions: 1,
        trend: [{ date: "2026-11-26", studyMinutes: 3, rushes: 3 }],
      })
      if (heldBehavior) {
        heldBehavior.resolve(sendBehavior)
        return
      }
      return sendBehavior()
    }
    return respond([])
  })

  const grid = ".rebyu-learner-grid"
  const tile = (id) => `${grid} [data-tile-id="${id}"]`
  const click = (label) => page.locator(`::-p-aria(${label}[role="button"])`).click()
  const geometry = () => page.evaluate((selector) => {
    const grid = document.querySelector(selector)
    const { left, top } = grid.getBoundingClientRect()
    return Object.fromEntries([...grid.querySelectorAll("[data-tile-id]")].map((item) => {
      const rect = item.getBoundingClientRect()
      return [item.dataset.tileId, [rect.left - left, rect.top - top, rect.width, rect.height].map(Math.round)]
    }))
  }, grid)
  const settle = () => page.evaluate(() => Promise.all(
    document.getAnimations().filter((animation) =>
      animation.effect?.target?.closest(".rebyu-learner-grid") && Number.isFinite(animation.effect.getComputedTiming().endTime),
    )
      .map((animation) => animation.finished.catch(() => {})),
  ))
  async function drag(selector, x, y) {
    const handle = await page.waitForSelector(selector, { visible: true })
    const box = await handle.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + x, box.y + box.height / 2 + y, { steps: 12 })
    await page.mouse.up()
    await settle()
  }

  const url = new URL(`${route}?certification=14`, server.resolvedUrls.local[0])
  await page.goto(url.href, { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => document.querySelector("#todays-plan")?.getBoundingClientRect().height === 296)
  const skeletonSelector = '[aria-label="Loading progress dashboard"]'
  await page.waitForSelector(skeletonSelector)
  await settle()
  const savedSkeleton = await geometry()
  const releaseSavedAnalytics = await heldAnalytics.promise
  heldAnalytics = null
  await releaseSavedAnalytics()
  await page.waitForSelector(skeletonSelector, { hidden: true })
  await page.evaluate(() => {
    const createObjectURL = URL.createObjectURL
    URL.createObjectURL = (blob) => {
      if (blob.type.startsWith("text/csv")) window.progressCsv = blob.text()
      return createObjectURL(blob)
    }
    document.addEventListener("click", (event) => {
      if (event.target.matches('a[download$=".csv"]')) event.preventDefault()
    })
  })
  await click("Export")
  await page.locator('::-p-text(CSV File (.csv))').click()
  await page.waitForFunction(() => [...document.querySelectorAll("button")]
    .some((button) => button.textContent.trim() === "Export" && button.disabled))
  const releaseBehavior = await heldBehavior.promise
  heldBehavior = null
  await releaseBehavior()
  await page.waitForFunction(() => window.progressCsv)
  const progressCsv = await page.evaluate(() => window.progressCsv)
  assert.match(progressCsv, /Skimming events \(fast scrolls\),3\r\n/)
  assert.match(progressCsv, /Date,Minutes studied,Skimming events \(fast scrolls\)\r\n2026-11-26,3,3/)
  const retakes = await page.$$eval('#score-over-time [aria-label="Assessments plotted"] li', (rows) =>
    rows.map((row) => row.querySelector(".truncate").textContent.trim()),
  )
  assert.deepEqual(retakes, Array.from({ length: 10 }, (_, index) => `Sample assessment ${index + 1}`))
  const history = await page.$$eval("#assessment-history li", (rows) =>
    rows.map((row) => row.querySelector(".truncate").textContent.trim()),
  )
  assert.deepEqual(history, Array.from({ length: 10 }, (_, index) => `Sample assessment ${12 - index}`))
  assert.equal(await page.$$eval("#assessment-history li button", (buttons) => buttons.length), 10)
  await settle()
  const before = await geometry()
  assert.deepEqual(before, savedSkeleton, "saved layout skeleton matches the displayed board")
  assert.equal(before["todays-plan"][3], 296)
  assert.equal(before["exam-readiness"][3], 400)
  await click("Customize layout")
  assert.deepEqual(await geometry(), before, "entering edit mode preserves a legacy layout with narrow cards")

  await drag(`${tile("todays-plan")} > .react-resizable-handle-s`, 0, 104)
  await drag(`${tile("player-card")} > .react-resizable-handle-e`, -269, 0)
  await drag(`${tile("player-card")} > span[aria-hidden]`, 269, 0)
  const edited = await geometry()
  assert.equal(edited["todays-plan"][3], 400)
  assert.ok(edited["player-card"][0] > before["player-card"][0], "drag changes the horizontal position")
  assert.ok(edited["player-card"][2] < before["player-card"][2], "resize changes the width")
  await click("Save layout")
  await page.waitForFunction(() => document.querySelector(".rebyu-learner-grid.is-editing"))
  assert.equal(saveAttempts, 1)
  assert.deepEqual(await geometry(), edited, "failed save preserves the draft")
  failSave = false
  await click("Save layout")
  await page.waitForSelector(`${grid}:not(.is-editing)`)
  // Wait for confirmation, since handles are disabled during the network call.
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Customize layout" && !button.disabled))
  assert.equal(saveAttempts, 2)
  assert.deepEqual(await geometry(), edited, "successful save matches the preview")
  assert.deepEqual(saved.find(({ id }) => id === "player-card"), { id: "player-card", x: 4, y: 0, w: 2, h: 3, hidden: null })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => document.querySelector("#todays-plan")?.getBoundingClientRect().height === 400)
  await settle()
  assert.deepEqual(await geometry(), edited, "refresh restores exact saved positions and dimensions")
  await click("Customize layout")
  await click("Reset layout")
  await settle()
  const defaultGeometry = await geometry()
  const columnStep = (defaultGeometry["score-over-time"][2] + 16) / 6
  const gridUnits = ([left, top, width, height]) => [
    Math.round(left / columnStep), Math.round(top / 104),
    Math.round((width + 16) / columnStep), Math.round((height + 16) / 104),
  ]
  assert.deepEqual(Object.fromEntries(Object.entries(defaultGeometry).map(([id, box]) => [id, gridUnits(box)])), {
    "todays-plan": [0, 0, 2, 7],
    "exam-readiness": [2, 0, 1, 4],
    "player-card": [3, 0, 3, 5],
    "exam-countdown": [2, 4, 1, 3],
    "topic-mastery": [3, 5, 3, 3],
    "next-up": [0, 7, 3, 4],
    "mastery-by-topic": [3, 8, 3, 7],
    "study-notes": [0, 11, 3, 4],
    "score-over-time": [0, 15, 6, 6],
    "assessment-history": [0, 21, 6, 5],
  }, "Reset previews the screenshot arrangement")
  await click("Cancel")
  await settle()
  assert.deepEqual(await geometry(), edited)
  assert.equal(saveAttempts, 2, "cancelled reset never writes")

  await page.setViewport({ width: 410, height: 1000 })
  await page.waitForFunction(() => document.querySelector("#exam-readiness")?.getBoundingClientRect().width > 350)
  await settle()
  const mobile = await geometry()
  assert.equal(mobile["exam-readiness"][0], 0)
  assert.equal(mobile["exam-readiness"][1], 416)
  await click("Customize layout")
  assert.deepEqual(await geometry(), mobile)
  await drag(`${tile("todays-plan")} > .react-resizable-handle-s`, 0, -104)
  const mobileEdit = await geometry()
  assert.equal(mobileEdit["todays-plan"][3], 296)
  await click("Save layout")
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Customize layout" && !button.disabled))
  assert.deepEqual(await geometry(), mobileEdit)
  assert.equal(saved.find(({ id }) => id === "player-card").w, 2, "mobile resize preserves desktop widths")

  saved = []
  heldAnalytics = Promise.withResolvers()
  await page.setViewport({ width: 1600, height: 1000 })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(skeletonSelector)
  await page.waitForFunction(() => document.querySelector("#todays-plan")?.getBoundingClientRect().height === 712)
  await settle()
  assert.deepEqual(await geometry(), defaultGeometry, "the skeleton uses the preset when no layout is saved")
  const releaseDefaultAnalytics = await heldAnalytics.promise
  heldAnalytics = null
  await releaseDefaultAnalytics()
  await page.waitForSelector(skeletonSelector, { hidden: true })
  assert.deepEqual(await geometry(), defaultGeometry, "learners without a saved layout see the reset preset")
  console.log("Learner dashboard default, layout-aware skeleton, drag, resize, save, reload and cancel passed")
} finally {
  await browser?.close()
  await server.close()
}
