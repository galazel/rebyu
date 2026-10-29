import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"
const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "progress-fixture", configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    if (!req.url.startsWith("/__progress_test")) return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, '<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/tests/tutor-progress-fixture.jsx"></script></body></html>'))
  })
} }] })
let browser
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  const url = `${server.resolvedUrls.local[0]}__progress_test`
  await page.goto(url)
  await page.waitForSelector('input[aria-label="Blank 1"]')
  const click = (text) => page.evaluate((text) => [...document.querySelectorAll("button")].find((button) => button.textContent.trim() === text).click(), text)
  await page.$eval('[aria-label="Answer choices"] button', (button) => button.click())
  await click("Show hint")
  await page.click('[aria-label="Flip to see the answer"]')
  await click("Got it")
  await click("Fixed")
  await click("Rent")
  await page.click('button[aria-label="Move down"]')
  await page.click('[data-tutor-widget="ordering"] .tg-btn-primary')
  await page.type('input[aria-label="Blank 1"]', "rent")
  await page.click('[data-tutor-widget="fill_blank"] .tg-btn-primary')
  await click("Fact")
  await click("Show all")
  await click("Collapse all")
  await page.focus('input[type="range"]')
  await page.keyboard.press("ArrowRight")
  const snapshot = () => page.evaluate(() => ({ text: document.getElementById("root").innerText, answers: [...document.querySelectorAll('[aria-label="Answer choices"] button:disabled')].length, blank: document.querySelector('input[aria-label="Blank 1"]').value, slider: document.querySelector('input[type="range"]').value, stored: JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith("rebyu:tutor-progress:")).sort().map((key) => [key, JSON.parse(localStorage.getItem(key))]))) }))
  const before = await snapshot()
  assert.match(before.text, /1\/1/)
  assert.match(before.text, /1\/2 known/)
  assert.match(before.text, /Answer: Three/)
  await page.reload()
  await page.waitForSelector('input[aria-label="Blank 1"]')
  assert.deepEqual(await snapshot(), before, "all activity states and scores must survive a real reload")
  await click("Restart quiz")
  await page.reload()
  await page.waitForSelector('input[aria-label="Blank 1"]')
  assert.equal(await page.$$eval('section:first-child [aria-label="Answer choices"] button:disabled', (nodes) => nodes.length), 0, "Try again reset must survive refresh")
  await page.goto(`${url}?scope=other-learner-chat`)
  await page.waitForSelector('input[aria-label="Blank 1"]')
  assert.equal(await page.$eval('input[aria-label="Blank 1"]', (node) => node.value), "", "another learner/chat must start fresh")
  console.log("PASS: nine real tutor activities persist through refresh, explicit reset persists, and learner/chat scopes stay isolated.")
} finally { await browser?.close(); await server.close() }
