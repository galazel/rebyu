import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "shared-usage", configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__shared_usage") return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/tests/shared-ai-usage-fixture.jsx"></script></body></html>'))
  })
} }] })
let browser
let saved
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    let data
    if (request.url().endsWith("/learner-tools/ai-usage")) data = [{ key: "tutor", label: "AI uses", daily: { used: 45, limit: 50 }, weekly: { used: 101, limit: 250 } }]
    else if (request.url().endsWith("/ai-usage/breakdown")) data = { today: { "tutor-chat": 30, "tutor-dialogue": 10, "tutor-live": 5 }, week: {}, days: [] }
    else if (request.url().includes("/ai/settings/live-tutor")) {
      if (request.method() === "PUT") saved = JSON.parse(request.postData())
      data = { settings: { enabled: true, dailySessionLimit: 5, maxDurationSeconds: 1800, voiceId: "educationVoice" }, voices: [], credits: { available: false }, proLimits: { dailyMessages: 50, weeklyMessages: 250 } }
    }
    if (data) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(data) })
    request.continue()
  })
  await page.goto(`${server.resolvedUrls.local[0]}__shared_usage`)
  await page.waitForFunction(() => document.body.textContent.includes("45 of 50") && document.body.textContent.includes("Live Tutor sessions"))
  const text = await page.$eval("body", (node) => node.innerText)
  assert.match(text, /101 of 250/)
  assert.match(text, /5 AI uses left today/)
  assert.doesNotMatch(text, /0 of 5|Live sessions per learner|have separate limits|default to 5/)
  const rows = await page.$$eval("li", (nodes) => nodes.map((node) => node.innerText.replace(/\s+/g, " ")))
  assert.ok(rows.some((row) => row.includes("Live Tutor sessions") && row.includes("5")))
  await page.evaluate(() => {
    const field = [...document.querySelectorAll("label")].find((node) => node.textContent.includes("Shared Pro AI uses / day")).querySelector("input")
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(field, "60")
    field.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await page.evaluate(() => [...document.querySelectorAll('button[type="submit"]')].find((node) => node.textContent.includes("Save Live Tutor")).click())
  for (let i = 0; i < 50 && !saved; i++) await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(saved?.proDailyMessages, 60)
  assert.equal(saved?.proWeeklyMessages, 250)
  assert.equal(Object.hasOwn(saved, "dailySessionLimit"), false)
  console.log("PASS: shared daily/weekly allowance, live-session breakdown, shared warning and admin settings without a separate live cap.")
} finally { await browser?.close(); await server.close() }
