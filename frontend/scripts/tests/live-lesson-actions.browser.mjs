import { existsSync, readFileSync } from "node:fs"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "/usr/bin/chromium", "/usr/bin/google-chrome"].find(existsSync)
if (!executablePath) throw new Error("An installed Chrome/Edge browser is needed for this integration test.")
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "live-teaching-test-fixture", configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__live_teaching_test") return next()
    const html = await vite.transformIndexHtml(req.url, '<!doctype html><html><body><button id="outside">Outside lesson</button><div id="root"></div><script type="module" src="/scripts/tests/live-lesson-fixture.jsx"></script></body></html>')
    res.setHeader("Content-Type", "text/html"); res.end(html)
  })
} }] })
let browser
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true, args: ["--disable-gpu"] })
  const page = await browser.newPage()
  await page.goto(`${server.resolvedUrls.local[0]}__live_teaching_test`)
  await page.waitForFunction(() => window.liveHarness, { timeout: 60000 })
  const catalog = await page.evaluate(() => window.liveHarness.catalog())
  const idFor = (kind, text) => catalog.find((item) => item.kind === kind && item.label.includes(text))?.id
  const act = (action, targetId) => page.evaluate((request) => window.liveHarness.execute(request), { action, targetId })
  assert.equal((await act("scroll_to_section", "section:break-even")).ok, true)
  assert.equal((await act("scroll_to_section", "section:contribution")).ok, true)
  const tab = await act("open_tab", idFor("tab", "Worked example"))
  assert.equal(tab.ok, true, JSON.stringify({ tab, catalog })); assert.equal(tab.state, "true"); assert.match(tab.visibleText, /leaves forty/)
  const accordionId = idFor("accordion", "Variable costs")
  assert.equal((await act("expand_accordion", accordionId)).state, "true")
  const again = await act("expand_accordion", accordionId)
  assert.equal(again.ok, true); assert.equal(again.changed, false, "an open accordion must not toggle shut")
  assert.equal((await act("collapse_accordion", accordionId)).state, "false")
  const cardId = idFor("card", "Contribution formula")
  assert.equal((await act("reveal_card", cardId)).state, "back")
  assert.equal((await act("reveal_card", cardId)).changed, false)
  assert.equal((await act("show_card_front", cardId)).state, "front")
  assert.equal((await act("execute_javascript", cardId)).ok, false)
  assert.equal((await act("open_tab", "#outside")).ok, false)
  assert.equal((await act("open_tab", "section:break-even")).ok, false)
  await page.evaluate(() => { document.getElementById("lesson-fixture").dispatchEvent(new WheelEvent("wheel", { bubbles: true })); })
  // Wait past the tutor-navigation window, then simulate intentional manual exploration.
  await new Promise((resolve) => setTimeout(resolve, 1600))
  await page.evaluate(() => { document.getElementById("lesson-fixture").dispatchEvent(new WheelEvent("wheel", { bubbles: true })); })
  assert.equal((await act("scroll_to_section", "section:break-even")).manualExploration, true)
  console.log("PASS: real lesson tabs, accordions, cards, navigation, action validation, and manual-exploration protection.")
  if (process.argv.includes("--provider")) {
    // Isolated provider integration: fictional fixture curriculum, no permanent key in the browser.
    const env = readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    const key = env.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "")
    if (!key) throw new Error("Configure the local ElevenLabs key before running the provider integration test.")
    const client = new ElevenLabsClient({ apiKey: key })
    const { signedUrl } = await client.conversationalAi.conversations.getSignedUrl({ agentId: "agent_3201m5fetfsjehhaamw8h5x4crm3" }).catch(() => { throw new Error("Could not obtain the provider test session.") })
    await page.reload()
    await page.waitForFunction(() => window.liveHarness?.startProvider)
    await page.evaluate((url) => window.liveHarness.startProvider(url), signedUrl)
    try {
      await page.waitForFunction(() => window.liveHarness.messages.some((item) => item.role === "agent" && item.message.includes("?")), { timeout: 30000 })
      await page.evaluate(() => window.liveHarness.answer("I am new to both ideas. Please teach me from the basics."))
      await page.waitForFunction(() => window.liveHarness.requests.length >= 1 && window.liveHarness.results.some((item) => item.tool === "lesson_action" && item.result.ok) && window.liveHarness.messages.filter((item) => item.role === "agent").length >= 3, { timeout: 90000 })
      const result = await page.evaluate(() => ({ messages: window.liveHarness.messages, tools: window.liveHarness.results, automaticRequests: window.liveHarness.requests.length, error: window.liveHarness.error }))
      assert.equal(result.error, undefined)
      const agentText = result.messages.filter((item) => item.role === "agent").map((item) => item.message).join(" ")
      assert.doesNotMatch(agentText, /ready to move on|would you like me to continue|should (?:I|we) (?:continue|proceed)|take that as a yes|say the word|still with me/i)
      assert.ok(result.tools.some((item) => item.tool === "teaching_step"))
      console.log(JSON.stringify({ providerTest: "PASS", assistantTurns: result.messages.filter((item) => item.role === "agent").length, automaticRequests: result.automaticRequests, confirmedUiActions: result.tools.filter((item) => item.tool === "lesson_action" && item.result.ok).length, teachingSteps: result.tools.filter((item) => item.tool === "teaching_step").length }))
    } finally { await page.evaluate(() => window.liveHarness.stop?.()) }
  }
} finally {
  await browser?.close()
  await server.close()
}
