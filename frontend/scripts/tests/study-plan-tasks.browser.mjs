/**
 * A recall quiz on Today's plan has to open a recall session, and a spaced
 * repetition review has to open its flashcards — not the lesson page.
 */
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
const route = "/__study_plan_tasks_test"

const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 0, hmr: false },
  plugins: [{
    name: "study-plan-tasks-fixture",
    configureServer(vite) {
      vite.middlewares.use(async (request, response, next) => {
        if (request.url?.split("?")[0] !== route) return next()
        response.setHeader("Content-Type", "text/html")
        response.end(await vite.transformIndexHtml(route, '<html><body><div id="root"></div><script type="module">import("/scripts/tests/study-plan-tasks-fixture.jsx")</script></body></html>'))
      })
    },
  }],
})

const today = new Date()
const dateKey = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-")

const event = (extra) => ({
  dateKey,
  at: "19:00",
  time: "7:00 PM",
  certificationId: 14,
  lessonId: 77,
  middleCategoryId: 5,
  lessonTitle: "Multimedia Technology",
  minutes: 15,
  ...extra,
})

const plans = [
  {
    planId: 1,
    status: "ACTIVE",
    certificationId: 14,
    schedule: {
      certification: "FE Exam",
      generatedAt: new Date().toISOString(),
      events: [
        event({ id: "a-quiz", type: "quiz", technique: "active-recall", title: "Recall quiz: Multimedia Technology" }),
        event({ id: "a-review", type: "review", technique: "spaced-repetition", title: "Review: Algorithm" }),
        event({ id: "a-mixed", type: "review", technique: "active-recall", title: "Review: Programming", lessonId: 88 }),
        event({ id: "a-lesson", type: "lesson", technique: "spaced-repetition", title: "Data Structures", minutes: 40 }),
      ],
    },
  },
]

const calls = []
let browser

try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  page.on("pageerror", (error) => console.error(error))
  await page.setViewport({ width: 1100, height: 1400 })
  page.setDefaultTimeout(60000)
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    const { hostname, pathname, protocol } = new URL(request.url())
    if (protocol === "https:" && hostname !== "127.0.0.1") return request.abort()
    if (!pathname.startsWith("/api/")) return request.continue()

    const respond = (data, status = 200) => request.respond({
      status, contentType: "application/json", body: JSON.stringify(data),
    })
    const body = request.postData() ? JSON.parse(request.postData()) : null
    calls.push({ method: request.method(), pathname, body })

    if (pathname.endsWith("/study-plans/my-plans")) return respond(plans)
    if (pathname.endsWith("/study-plans/me/tasks")) return respond([])
    if (pathname.includes("/tasks/") && pathname.endsWith("/status")) return respond({})
    if (pathname.endsWith("/recall-sessions")) return respond({ examId: 4242, itemCount: 8, basis: "missed" })
    if (pathname.endsWith("/review-sessions/due")) {
      return respond({
        dueCount: 1,
        seeded: false,
        cards: [{ questionId: 9, question: "What does FIFO stand for?", answer: "First in, first out", lessonTitle: "Algorithm" }],
      })
    }
    return respond([])
  })

  const url = new URL(route, server.resolvedUrls.local[0])
  await page.goto(url.href, { waitUntil: "domcontentloaded" })

  const clickTask = async (label) => {
    const button = await page.waitForSelector(`::-p-xpath(//button[normalize-space()='${label}'])`)
    await button.click()
  }
  const text = () => page.evaluate(() => document.body.innerText)
  const where = () => page.evaluate(() => document.querySelector('[data-testid="where"]').textContent)

  // 1. The recall quiz opens a recall session, scoped to its own lesson.
  await clickTask("Start recall quiz")
  await page.waitForFunction(() => document.body.innerText.includes("8 questions ready"))
  const shown = await text()
  assert.ok(shown.includes("Recall quiz"), "the recall quiz opens the active recall session")
  const recall = calls.find((call) => call.pathname.endsWith("/recall-sessions"))
  assert.equal(recall.body.lessonId, 77, "the recall session is built from the task's lesson")
  assert.equal(recall.body.certificationId, 14)
  assert.equal(recall.body.size, 10, "a day-after recall quiz is the short one")
  assert.ok(
    calls.some((call) => call.method === "PUT" && call.pathname.includes("/tasks/a-quiz/status")),
    "opening the task records it as started",
  )
  assert.equal(await where(), route, "opening a recall quiz does not navigate to the lesson")

  // 2. Closing it leaves the plan where it was.
  await clickTask("Not now")
  await page.waitForFunction(() => !document.body.innerText.includes("8 questions ready"))

  // 3. A spaced repetition review opens its flashcards, not the lesson.
  await clickTask("Start flashcard review")
  await page.waitForFunction(() => document.body.innerText.includes("FIFO"))
  const due = calls.find((call) => call.pathname.endsWith("/review-sessions/due"))
  assert.equal(due.body.lessonId, 77, "the review is scoped to the task's lesson")
  assert.equal(await where(), route, "opening a review does not navigate to the lesson")
  await clickTask("Show answer")
  const answer = await page.waitForSelector("[role=dialog] .tg-face-back")
  const answerIsVisible = await answer.evaluate(async (panel) => {
    await Promise.all(panel.getAnimations().map((animation) => animation.finished))
    const { left, top, width, height } = panel.getBoundingClientRect()
    return panel.contains(document.elementFromPoint(left + width / 2, top + height / 2))
  })
  assert.equal(await answer.evaluate((panel) => panel.querySelector("p:last-child").textContent.trim()), "First in, first out")
  assert.ok(answerIsVisible, "the revealed answer faces the learner")
  assert.equal(await page.$eval('[role=dialog] .tg-conf-good', (button) => button.disabled), false)
  await page.keyboard.press("Escape")
  await page.waitForFunction(() => !document.body.innerText.includes("FIFO"))

  // 4. A lesson day still opens the lesson.
  await clickTask("Open lesson")
  await page.waitForFunction(
    () => document.querySelector('[data-testid="where"]').textContent.includes("/learner/learning/14/topics/5"),
  )

  // 5. An active-recall review is the longer, interleaved session, not the same quiz.
  await page.goBack()
  await clickTask("Start mixed recall")
  await page.waitForFunction(() => document.body.innerText.includes("8 questions ready"))
  const mixed = calls.filter((call) => call.pathname.endsWith("/recall-sessions")).at(-1)
  assert.equal(mixed.body.lessonId, 88, "the review leads with its own topic")
  assert.equal(mixed.body.size, 20, "a review is the longer, interleaved session")
  assert.ok(
    (await text()).includes("Mixed recall review"),
    "a review and a recall quiz are not the same session",
  )

  console.log("study-plan-tasks: recall quiz, flashcard review, lesson and mixed recall tasks all open the right thing")
} finally {
  await browser?.close()
  await server.close()
}
