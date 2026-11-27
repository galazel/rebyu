import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const server = await createServer({ root, define: { "import.meta.env.VITE_SHOW_LIVE_TUTOR": '"false"' }, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "shared-usage", configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__shared_usage") return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/tests/shared-ai-usage-fixture.jsx"></script></body></html>'))
  })
} }] })
let browser
let saved
const initialTimers = { lessonQuizMinutes: 10, middleExamMinutes: 30, majorExamMinutes: 60 }
let savedTimers
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    let data
    if (request.url().endsWith("/learner-tools/ai-usage")) data = [{ key: "tutor", label: "AI uses", daily: { used: 45, limit: 50 }, weekly: { used: 101, limit: 250 } }]
    else if (request.url().endsWith("/ai-usage/breakdown")) data = { today: { "tutor-chat": 30, "tutor-dialogue": 10, "tutor-live": 5 }, week: {}, days: [] }
    else if (request.url().endsWith("/ai/tutor/conduct")) data = { strikes: 0 }
    else if (request.url().endsWith("/ai/settings")) data = { tasks: [], models: [] }
    else if (request.url().endsWith("/ai/settings/reading-guard")) data = { skimCooldownSeconds: 120 }
    else if (request.url().endsWith("/exams/timers")) {
      if (request.method() === "PUT") savedTimers = JSON.parse(request.postData())
      data = savedTimers ?? initialTimers
    }
    else if (request.url().includes("/ai/settings/live-tutor")) {
      if (request.method() === "PUT") saved = JSON.parse(request.postData())
      data = { settings: { enabled: true, dailySessionLimit: 5, maxDurationSeconds: 1800, voiceId: "educationVoice" }, voices: [], credits: { available: false }, proLimits: { dailyMessages: 50, weeklyMessages: 250 } }
    }
    if (data) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(data) })
    request.continue()
  })
  await page.goto(`${server.resolvedUrls.local[0]}__shared_usage`, { waitUntil: "domcontentloaded", timeout: 60000 })
  await page.waitForFunction(() => document.body.textContent.includes("45 of 50") && document.querySelector("#section-pro-ai-limits input"))
  const text = await page.$eval("body", (node) => node.textContent)
  assert.match(text, /101 of 250/)
  assert.match(text, /5 AI uses left today/)
  assert.doesNotMatch(text, /Live Tutor|ElevenLabs|Teaching voice|Voice ID|Maximum session length|Refresh balance/i)
  const rows = await page.$$eval("li", (nodes) => nodes.map((node) => node.innerText.replace(/\s+/g, " ")))
  assert.ok(rows.some((row) => row.includes("Other tutor activity") && row.includes("5")))
  await page.evaluate(() => {
    const field = [...document.querySelectorAll("label")].find((node) => node.textContent.includes("Shared Pro AI uses / day")).querySelector("input")
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(field, "60")
    field.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await page.click('#section-pro-ai-limits button[type="submit"]')
  for (let i = 0; i < 50 && !saved; i++) await new Promise((resolve) => setTimeout(resolve, 50))
  assert.deepEqual(saved, { enabled: true, maxDurationSeconds: 1800, voiceId: "educationVoice", proDailyMessages: 60, proWeeklyMessages: 250 })
  const timerField = '#section-assessment-timers input'
  await page.waitForSelector(`${timerField}:enabled`)
  await page.$eval(timerField, (field) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(field, "15")
    field.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/exams/timers") && response.request().method() === "PUT"),
    page.click('#section-assessment-timers button[type="submit"]'),
  ])
  assert.deepEqual(savedTimers, { ...initialTimers, lessonQuizMinutes: 15 })
  console.log("PASS: Admin Others saves Pro AI limits and shared assessment timers.")
} finally { await browser?.close(); await server.close() }
