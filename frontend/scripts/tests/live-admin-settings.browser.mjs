import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"

const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "/usr/bin/chromium"].find(existsSync)
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "admin-live-test", configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__live_admin_test") return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/tests/live-admin-fixture.jsx"></script></body></html>'))
  })
} }] })
let browser, savedRequest, creditsAvailable = true
let settings = { enabled: true, dailySessionLimit: 5, maxDurationSeconds: 1800, voiceId: "voiceA" }
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    if (request.url().includes("/api/ai/settings/live-tutor")) {
      if (request.method() === "PUT") { savedRequest = JSON.parse(request.postData()); settings = { ...settings, ...savedRequest } }
      return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(request.method() === "PUT" ? settings : { settings, proLimits: { dailyMessages: 50, weeklyMessages: 250 }, credits: creditsAvailable ? { available: true, remaining: 8000, used: 2000, limit: 10000, tier: "starter" } : { available: false, reason: "Balance permission unavailable" }, voices: [{ id: "voiceA", name: "Teacher A" }, { id: "voiceB", name: "Teacher B" }] }) })
    }
    if (request.url().includes("/api/learner-tools/ai-usage")) {
      return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify([
        { key: "tutor", daily: { used: 1, limit: 50 }, weekly: { used: 3, limit: 250 } },
        { key: "liveTutor", label: "Live Tutor sessions", daily: { used: 4, limit: 5 }, weekly: null },
      ]) })
    }
    return request.continue()
  })
  await page.goto(`${server.resolvedUrls.local[0]}__live_admin_test`)
  await page.waitForSelector('input[type="number"]', { timeout: 60000 })
  await page.waitForFunction(() => document.body.textContent.includes("4 of 5"))
  assert.equal(await page.evaluate(() => (document.body.textContent.match(/Weekly/g) ?? []).length), 1, "live sessions must not invent a weekly cap")
  await page.select("select", "voiceB")
  await page.evaluate(() => {
    const input = document.querySelector('input[type="number"]')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "8")
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await page.click('button[type="submit"]')
  await page.waitForFunction(() => document.querySelector('button[type="submit"]').disabled)
  assert.equal(savedRequest.dailySessionLimit, 8)
  assert.equal(savedRequest.voiceId, "voiceB")
  assert.equal(savedRequest.proDailyMessages, 50)
  assert.equal(savedRequest.maxDurationSeconds, 1800)
  assert.equal(savedRequest.apiKey, undefined)
  creditsAvailable = false
  await page.reload()
  await page.waitForFunction(() => document.body.textContent.includes("Balance permission unavailable"))
  assert.equal(await page.$eval('input[type="number"]', (input) => input.value), "8")
  console.log("PASS: admin voice/cap form, safe save payload, unavailable-credit state and persisted-value restoration.")
} finally { await browser?.close(); await server.close() }
