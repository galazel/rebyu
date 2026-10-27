import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "/usr/bin/chromium"].find(existsSync)
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "typing-test-provider", enforce: "pre", resolveId(id) {
  if (id === "@elevenlabs/client") return fileURLToPath(new URL("./live-typing-provider-mock.js", import.meta.url))
}, configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__live_typing_test") return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/tests/live-typing-fixture.jsx"></script></body></html>'))
  })
} }] })
let browser, failSubmit = false, failLiveStart = false
const usageChecks = []
let graphTyping = false, graphPaused = false, graphClosed = false, graphAwaiting = false
const graphEvents = []
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    let data
    if (request.url().endsWith("/turn")) {
      const event = JSON.parse(request.postData())
      graphEvents.push(event)
      if (event.action === "submit" && failSubmit) return request.respond({ status: 503, contentType: "application/json", body: '{"message":"Graph unavailable"}' })
      if (event.action === "typing") graphTyping = event.active
      if (event.action === "pause") graphPaused = true
      if (event.action === "resume") graphPaused = false
      if (event.action === "close") graphClosed = true
      if (event.action === "open") graphClosed = graphTyping = graphPaused = graphAwaiting = false
      if (event.action === "submit") { graphTyping = false; graphAwaiting = true }
      if (event.action === "agent_message") graphAwaiting = false
      const phase = graphClosed ? "CLOSED" : graphPaused ? "PAUSED" : graphTyping ? "COMPOSING" : graphAwaiting ? "EVALUATING_ANSWER" : "TEACHING"
      data = { sequence: event.sequence, phase, allowContinue: phase === "TEACHING", allowSpeak: ["TEACHING", "EVALUATING_ANSWER"].includes(phase), directive: event.action === "submit" ? "Evaluate the submitted answer first." : "", stale: false }
    }
    else if (request.url().endsWith("/api/ai/tutor/live/session")) {
      if (failLiveStart) return request.respond({ status: 503, contentType: "application/json", body: '{"message":"ElevenLabs credits exhausted. This failed connection does not count toward your AI allowance."}' })
      data = { sessionId: "fixture", usageId: 777, signedUrl: "mock-only", lessonName: "Fixture lesson", lessonContent: "Fixed costs and contribution", checkpoint: {}, transcript: [] }
    }
    else if (request.url().includes("/usage/777")) { usageChecks.push(request.postData()); data = { status: "hold-live", charged: false } }
    else if (request.url().includes("/api/ai/tutor/live/sessions/")) data = { status: "saved" }
    else if (request.url().includes("/api/learner-tools/ai-usage")) data = [{ key: "tutor", daily: { used: 0, limit: 50 }, weekly: { used: 0, limit: 250 } }]
    if (data) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(data) })
    return request.continue()
  })
  await page.goto(`${server.resolvedUrls.local[0]}__live_typing_test`)
  await page.waitForFunction(() => window.liveTypingMock, { timeout: 60000 })
  const step = await page.evaluate(() => window.liveTypingMock.options.clientTools.teaching_step({ kind: "explain", concept: "Fixed costs", sectionId: "intro" }))
  assert.equal(JSON.parse(step).lessonView.interactions[0]?.state, "true", "the real teaching-step handler must reveal the relevant lesson tool")
  await page.click('[data-live-accordion="fixed"]')
  await page.evaluate(() => [...document.querySelectorAll("button")].find((button) => button.textContent === "Chat").click())
  await page.type('input[aria-label="Message live tutor"]', "My private draft", { delay: 10 })
  await page.waitForFunction(() => document.body.textContent.includes("tutor is waiting for Send"))
  await new Promise((resolve) => setTimeout(resolve, 2500))
  let state = await page.evaluate(() => ({ activity: window.liveTypingMock.activity, context: window.liveTypingMock.context, messages: window.liveTypingMock.messages }))
  assert.ok(state.activity >= 2)
  assert.equal(state.messages.length, 0, "no automatic continuation while composing")
  assert.ok(state.context.some((text) => text.includes('"active":true')))
  assert.ok(state.context.every((text) => !text.includes("My private draft")), "unsent text must remain private")
  const navigation = await page.evaluate(() => window.liveTypingMock.options.clientTools.lesson_action({ action: "scroll_to_section", targetId: "section:intro" }))
  assert.equal(JSON.parse(navigation).ok, false)
  const blockedStep = await page.evaluate(() => window.liveTypingMock.options.clientTools.teaching_step({ kind: "explain", concept: "Fixed costs", sectionId: "intro" }))
  assert.equal(JSON.parse(blockedStep).ok, false)
  assert.equal(await page.$eval('[data-live-accordion="fixed"]', (node) => node.getAttribute("aria-expanded")), "false", "typing must block automatic tool reveals too")
  await page.click('button[aria-label="Send message"]')
  await page.waitForFunction(() => !document.body.textContent.includes("tutor is waiting for Send"))
  state = await page.evaluate(() => ({ messages: window.liveTypingMock.messages, context: window.liveTypingMock.context }))
  assert.deepEqual(state.messages, ["My private draft"])
  assert.ok(state.context.some((text) => text.includes('"active":false')))
  assert.equal(await page.$eval('input[aria-label="Message live tutor"]', (input) => input.value), "")
  assert.ok(graphEvents.some((event) => event.action === "typing" && event.active))
  assert.ok(graphEvents.filter((event) => event.action === "typing").every((event) => event.message === undefined))
  assert.ok(graphEvents.some((event) => event.action === "submit" && event.message === "My private draft"))
  failSubmit = true
  await page.type('input[aria-label="Message live tutor"]', "Retain this answer")
  await page.click('button[aria-label="Send message"]')
  await page.waitForFunction(() => document.querySelector('button[aria-label="Send message"]').getAttribute("aria-busy") === "false")
  assert.equal(await page.$eval('input[aria-label="Message live tutor"]', (input) => input.value), "Retain this answer")
  assert.equal(await page.evaluate(() => window.liveTypingMock.messages.includes("Retain this answer")), false)
  await page.evaluate(() => window.liveTypingMock.options.onError("quota_exceeded"))
  await page.waitForFunction(() => document.body.textContent.includes("50 shared AI uses left today"))
  assert.ok(usageChecks.length >= 1, "browser lifecycle must request server-owned provider verification")
  assert.ok(usageChecks.every((body) => !body || body === "{}"), "browser must not claim a successful use or request arbitrary refunds")
  failLiveStart = true
  await page.reload()
  await page.waitForFunction(() => document.body.textContent.includes("Reconnect voice") && document.body.textContent.includes("50 shared AI uses left today"))
  assert.equal(await page.evaluate(() => Boolean(window.liveTypingMock)), false, "no provider SDK start after server rejects exhausted credits")
  console.log("PASS: real Live Tutor typing indicator, provider activity heartbeat, continuation/navigation hold, draft privacy and explicit submission.")
  console.log("PASS: server verification on connection failure and no charged allowance/SDK startup for exhausted credits.")
} finally { await browser?.close(); await server.close() }
