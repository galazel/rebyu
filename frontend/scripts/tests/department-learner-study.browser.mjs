/**
 * A department head opening a learner sees how that learner has been studying
 * the certification on screen -- time, focus and skimming -- and the figures
 * follow the certification tab rather than the whole account.
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
const route = "/__department_learner_study_test"

const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 0, hmr: false },
  plugins: [{
    name: "department-learner-study-fixture",
    configureServer(vite) {
      vite.middlewares.use(async (request, response, next) => {
        if (request.url?.split("?")[0] !== route) return next()
        response.setHeader("Content-Type", "text/html")
        response.end(await vite.transformIndexHtml(route, '<html><body><div id="root"></div><script type="module">import("/scripts/tests/department-learner-study-fixture.jsx")</script></body></html>'))
      })
    },
  }],
})

const day = (offset) => {
  const date = new Date()
  date.setDate(date.getDate() - offset)
  return date.toISOString().slice(0, 10)
}

const behaviourFor = {
  14: {
    todayStudyMinutes: 0,
    weekStudyMinutes: 3,
    challengeCompletions: 4,
    rushEvents: 5,
    focusConsistency: 0,
    readingPace: "Rushed",
    trend: [6, 5, 4, 3, 2, 1, 0].map((back) => ({ date: day(back), studyMinutes: back === 2 ? 3 : 0, rushes: back === 2 ? 5 : 0 })),
  },
  21: {
    todayStudyMinutes: 12,
    weekStudyMinutes: 90,
    challengeCompletions: 1,
    rushEvents: 0,
    focusConsistency: 100,
    readingPace: "Steady",
    trend: [6, 5, 4, 3, 2, 1, 0].map((back) => ({ date: day(back), studyMinutes: 15, rushes: 0 })),
  },
}

const roster = [
  { learnerId: 9, certificationId: 14, certificationTitle: "IT Passport Exam", name: "Glyzel Galagar", username: "glyzelgalagar27", status: "active", sectionName: "BSCS-3A" },
  { learnerId: 9, certificationId: 21, certificationTitle: "TOPCIT", name: "Glyzel Galagar", username: "glyzelgalagar27", status: "active", sectionName: "BSCS-3A" },
]

const analyticsFor = (certificationId) => ({
  certificationId,
  certificationTitle: certificationId === 21 ? "TOPCIT" : "IT Passport Exam",
  completedLessonCount: 5,
  totalLessonCount: 63,
  passedAssessmentCount: 3,
  totalAssessmentCount: 96,
  totalAssessmentAttempts: 18,
  hasAssessmentActivity: true,
  scoreTrend: [],
  weakestTopics: [],
})

const asked = []
let browser

try {
  await server.listen()
  browser = await puppeteer.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  page.on("pageerror", (error) => console.error(error))
  await page.setViewport({ width: 1400, height: 1200 })
  page.setDefaultTimeout(60000)
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    const { hostname, pathname, search, protocol } = new URL(request.url())
    if (protocol === "https:" && hostname !== "127.0.0.1") return request.abort()
    if (!pathname.startsWith("/api/")) return request.continue()
    const respond = (data, status = 200) => request.respond({
      status, contentType: "application/json", body: JSON.stringify(data),
    })
    const certificationId = Number(new URLSearchParams(search).get("certificationId")) || 14

    if (pathname.endsWith("/study-behavior")) {
      asked.push(certificationId)
      return respond(behaviourFor[certificationId] ?? behaviourFor[14])
    }
    if (pathname.endsWith("/analytics")) return respond(analyticsFor(certificationId))
    if (pathname.endsWith("/overview")) return respond({ learners: [{ learnerId: 9, status: "at_risk", reason: "Averaging 39%" }] })
    if (/\/departments\/\d+\/learners$/.test(pathname)) return respond(roster)
    if (/\/departments\/\d+$/.test(pathname)) {
      return respond({ departmentId: 1, name: "BSCS", certifications: [
        { certificationId: 14, title: "IT Passport Exam" }, { certificationId: 21, title: "TOPCIT" },
      ] })
    }
    if (pathname.endsWith("/integrity")) return respond({ risk: null, attempts: [] })
    return respond([])
  })

  const url = new URL(route, server.resolvedUrls.local[0])
  await page.goto(url.href, { waitUntil: "domcontentloaded" })

  const text = () => page.evaluate(() => document.body.innerText)

  await page.waitForFunction(() => document.body.innerText.includes("Study behaviour this week"))
  if (process.env.SHOT_DIR) {
    const box = await page.$("::-p-xpath(//h2[normalize-space()='Study behaviour this week']/ancestor::section)")
    await box?.screenshot({ path: `${process.env.SHOT_DIR}/dept-study-behaviour.png` })
  }
  const shown = await text()
  assert.match(shown, /3\s*min studied · 0 today/, "the learner's week is shown as they see it")
  assert.ok(shown.includes("0% focus"), "focus consistency is shown")
  assert.ok(shown.includes("Rushed pace"), "the reading pace is shown")
  assert.ok(shown.includes("4 focus checks done"), "focus checks are shown")
  assert.ok(
    shown.includes("Skimmed many sections quickly"),
    "the skimming is spelled out for staff, not for the learner",
  )
  assert.ok(shown.includes("IT Passport Exam"), "the section names the certification it covers")

  // The figures follow the certification tab.
  await page.locator("::-p-xpath(//button[normalize-space()='TOPCIT'])").click()
  await page.waitForFunction(() => document.body.innerText.includes("Steady pace"))
  const second = await text()
  assert.match(second, /90\s*min studied · 12 today/, "the other certification has its own week")
  assert.ok(asked.includes(21), "the second certification is asked for by id")

  console.log("department-learner-study: a head sees the learner's week, per certification")
} finally {
  await browser?.close()
  await server.close()
}
