import { existsSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import puppeteer from "puppeteer-core"
import { createServer } from "vite"

const root = fileURLToPath(new URL("../../", import.meta.url))
const executablePath = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync)
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, hmr: false }, plugins: [{ name: "skim-fixture", configureServer(vite) {
  vite.middlewares.use(async (req, res, next) => {
    const pathname = req.url.split("?")[0]
    const fixture = pathname === "/__skim_test" ? "skim-guard-fixture" : pathname === "/__skim_result" ? "skim-result-fixture" : null
    if (!fixture) return next()
    res.setHeader("Content-Type", "text/html")
    res.end(await vite.transformIndexHtml(req.url, `<!doctype html><html><head><link rel="icon" href="/vite.svg"></head><body><div id="root"></div><script type="module" src="/scripts/tests/${fixture}.jsx"></script></body></html>`))
  })
} }] })
let browser
let creates = 0
const releaseChecks = []
const diagramXml = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Student" vertex="1" parent="1"/></root></mxGraphModel>'
let allFormatDrafts
let programmingRun
try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  const browserErrors = []
  page.on("pageerror", (error) => browserErrors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.status() >= 400) browserErrors.push(`HTTP ${response.status()} ${response.url()}`)
  })
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    if (request.url().endsWith("/knowledge-checks") && request.method() === "POST") {
      creates++
      releaseChecks.push(() => request.respond({ status: 200, contentType: "application/json", body: '{"examId":42}' }))
      return
    }
    if (request.url().endsWith("/assessment-attempts/99/submit")) {
      const drafts = JSON.parse(request.postData()).answers
      if (drafts.length > 2) {
        allFormatDrafts = drafts
        return request.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            correctCount: drafts.length,
            percentage: 100,
            passed: true,
            answers: drafts.map((draft) => ({
              ...draft,
              question: "Reviewed question",
              isCorrect: true,
              credit: 1,
              diagramSubmitted: Boolean(draft.diagramSubmissionData),
            })),
          }),
        })
      }
      return request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          correctCount: 1,
          percentage: 75,
          passed: true,
          answers: [{
            attemptQuestionId: 1,
            question: "What allows separate business teams to work from the same ERP records?",
            selectedChoiceId: drafts[0].selectedChoiceId,
            isCorrect: true,
          }, {
            attemptQuestionId: 3,
            question: "A sales team receives an order for a product. Explain how ERP helps the warehouse respond.",
            isCorrect: false,
            credit: 0.5,
            subQuestionAnswers: [{
              subQuestionId: 4,
              learnerAnswer: JSON.parse(drafts[1].learnerAnswer)[4],
              earnedPoints: 0.5,
              maxPoints: 1,
              feedback: "Also explain how the order identifies the item and quantity to reserve.",
            }],
          }],
        }),
      })
    }
    if (request.url().endsWith("/learner-achievements/me/rewards")) {
      return request.respond({ status: 200, contentType: "application/json", body: "{}" })
    }
    if (request.url().endsWith("/ai/settings/reading-guard")) {
      return request.respond({ status: 200, contentType: "application/json", body: '{"skimCooldownSeconds":180}' })
    }
    if (request.url().includes("/programming/17/executions?")) {
      return request.respond({ status: 200, contentType: "application/json", body: "[]" })
    }
    if (request.url().endsWith("/programming/17/run")) {
      programmingRun = JSON.parse(request.postData())
      return request.respond({ status: 200, contentType: "application/json", body: '{"stdout":"7"}' })
    }
    if (new URL(request.url()).hostname === "embed.diagrams.net") {
      return request.respond({
        status: 200,
        contentType: "text/html",
        body: `<!doctype html><button disabled>Draw student entity</button><script>
          const button = document.querySelector("button");
          const send = (message) => parent.postMessage(JSON.stringify(message), "*");
          addEventListener("message", (event) => {
            if (JSON.parse(event.data).action === "load") {
              send({ event: "load" });
              button.disabled = false;
            }
          });
          button.onclick = () => send({ event: "autosave", xml: ${JSON.stringify(diagramXml)} });
          send({ event: "init" });
        </script>`,
      })
    }
    if (request.url().includes("/attempts")) return request.respond({ status: 200, contentType: "application/json", body: '{"assessmentAttemptId":99}' })
    if (request.url().endsWith("/key")) return request.respond({ status: 200, contentType: "application/json", body: '[]' })
    request.continue()
  })
  await page.goto(`${server.resolvedUrls.local[0]}__skim_test`, { waitUntil: "domcontentloaded", timeout: 60_000 })
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

  await page.setViewport({ width: 1200, height: 980 })
  await page.goto(`${server.resolvedUrls.local[0]}__skim_result`, { waitUntil: "domcontentloaded", timeout: 60_000 })
  const clickButton = (name) => page.locator(`::-p-aria([name="${name}"][role="button"])`).click()
  await clickButton("Start focus check")
  await page.locator("::-p-text(A shared database)").click()
  await clickButton("Next")
  await page.locator('textarea[aria-label="How does the warehouse know which stock to reserve?"]').fill("The warehouse can see the sales order.")
  await clickButton("See my score")
  await page.waitForSelector('[data-slot="alert-dialog-content"] ol')
  const sample = await page.$eval('[role="alertdialog"]', (dialog) => ({
    score: dialog.querySelector('[aria-label="Final score"]').textContent,
    review: dialog.textContent,
  }))
  assert.equal(sample.score, "75%")
  assert.match(sample.review, /Which teams share data in this example\?/u)
  assert.match(sample.review, /How does the warehouse know which stock to reserve\?/u)
  assert.match(sample.review, /Partial credit0\.5 \/ 1 pts/u)
  assert.match(sample.review, /The warehouse can see the sales order\./u)
  assert.match(sample.review, /Also explain how the order identifies the item and quantity to reserve\./u)
  const previewTrigger = '[aria-label="Enlarge figure"]'
  const closePreview = '[aria-label="Close figure"]'
  await page.locator(previewTrigger).click()
  await page.waitForSelector(closePreview, { visible: true })
  assert.equal(await page.$eval(closePreview, (button) => document.activeElement === button), true)
  await page.click(closePreview)
  await page.waitForSelector(closePreview, { hidden: true })
  await page.waitForFunction((selector) => document.activeElement === document.querySelector(selector), {}, previewTrigger)

  await page.keyboard.press("Enter")
  await page.waitForSelector(closePreview, { visible: true })
  await page.keyboard.press("Escape")
  await page.waitForSelector(closePreview, { hidden: true })
  await page.waitForSelector('[data-slot="alert-dialog-content"] ol', { visible: true })
  if (process.argv.includes("--sample")) {
    const output = new URL("../../.native-test-output/", import.meta.url)
    mkdirSync(output, { recursive: true })
    await page.$eval('[data-slot="alert-dialog-content"] > ol', (list) => { list.scrollTop = list.scrollHeight })
    await page.screenshot({ path: fileURLToPath(new URL("skim-challenge-sample.png", output)) })
    console.log("Sample result: 75%; sub-question: Partial credit — 0.5 / 1 pts.")
  }
  await page.setViewport({ width: 390, height: 844 })
  await page.locator(previewTrigger).click()
  await page.waitForSelector(closePreview, { visible: true })
  await page.click(closePreview)
  await page.waitForSelector(closePreview, { hidden: true })
  await clickButton("Continue reading")
  await page.waitForSelector('[data-slot="alert-dialog-content"]', { hidden: true })
  console.log("PASS: Skim Challenge result images close with the button and Escape, return focus, and leave the results usable.")

  await page.setViewport({ width: 1200, height: 980 })
  await page.goto(`${server.resolvedUrls.local[0]}__skim_result?all-formats`, { waitUntil: "domcontentloaded", timeout: 60_000 })
  await clickButton("Start focus check")
  const next = () => clickButton("Next")
  const fill = (label, value) => page.locator(`::-p-aria([name="${label}"][role="textbox"])`).fill(value)

  await page.locator("::-p-text(Router)").click()
  await next()
  await page.locator('[aria-label="Choice A"]').click()
  await page.locator('[aria-label="Choice B"]').click()
  await next()
  await page.locator('input[placeholder="Type your answer"]').fill("DNS")
  await next()
  await fill("Part A", "Table")
  await fill("Part B", "Row")
  await next()
  await fill("Your written answer", "A backup lets you recover lost data.")
  await next()
  await fill("Your working", "2 + 2")
  await fill("Final answer", "4")
  await next()
  await page.locator(".cm-content").click()
  await page.keyboard.sendCharacter("print(7)")
  await clickButton("Run")
  await page.waitForFunction(() => document.querySelector("pre")?.textContent.trim() === "7")
  assert.equal(programmingRun.code, "print(7)")
  assert.equal(programmingRun.language, "Python")
  await next()

  const iframe = await page.waitForSelector('iframe.diagrams-iframe')
  const diagramFrame = await iframe.contentFrame()
  await diagramFrame.locator("button:not(:disabled)").click()
  await next()
  await page.locator("::-p-text(True)").click()
  await next()
  await fill("Your written answer", "Daily backups lose less recent work.")
  await clickButton("See my score")
  await page.waitForSelector('[aria-label="Final score"]', { visible: true })
  assert.equal(await page.$eval('[aria-label="Final score"]', (element) => element.textContent), "100%")
  assert.deepEqual(allFormatDrafts.map((draft) => draft.attemptQuestionId), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  assert.equal(allFormatDrafts[0].selectedChoiceId, 1)
  assert.deepEqual(JSON.parse(allFormatDrafts[1].learnerAnswer), [2, 3])
  assert.equal(allFormatDrafts[2].learnerAnswer, "DNS")
  assert.deepEqual(JSON.parse(allFormatDrafts[3].learnerAnswer), { 41: "Table", 42: "Row" })
  assert.equal(allFormatDrafts[4].learnerAnswer, "A backup lets you recover lost data.")
  assert.match(allFormatDrafts[5].learnerAnswer, /2 \+ 2[\s\S]*Final answer: 4/u)
  assert.equal(allFormatDrafts[6].submittedCode, "print(7)")
  assert.equal(allFormatDrafts[7].diagramSubmissionData, diagramXml)
  assert.equal(allFormatDrafts[8].selectedChoiceId, 9)
  assert.equal(allFormatDrafts[9].learnerAnswer, "Daily backups lose less recent work.")
  const allFormatReview = await page.$eval('[role="alertdialog"]', (element) => element.textContent)
  for (const value of ["Router", "TCP", "UDP", "DNS", "Table", "Row", "A backup lets you recover lost data.", "2 + 2", "print(7)", "Diagram submitted", "True", "Daily backups lose less recent work."]) {
    assert.ok(allFormatReview.includes(value), `Missing result review for ${value}`)
  }
  assert.deepEqual(browserErrors, [], "Skim Challenge should produce no browser errors")
  console.log("PASS: all 8 authored question types plus True/False and written Critical Thinking submit and appear in results without browser errors.")
} finally { await browser?.close(); await server.close() }
