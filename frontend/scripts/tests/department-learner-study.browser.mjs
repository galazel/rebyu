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
  { learnerId: 9, certificationId: 14, certificationTitle: "IT Passport Exam", name: "Sample Learner", username: "samplelearner", status: "active", sectionName: "Passport section", completedLessonCount: 63, totalLessonCount: 63, mockExamPassed: true, bestMockExamScore: 100 },
  { learnerId: 9, certificationId: 21, certificationTitle: "TOPCIT", name: "Sample Learner", username: "samplelearner", status: "active", sectionName: "TOPCIT section", completedLessonCount: 29, totalLessonCount: 64, mockExamPassed: false, bestMockExamScore: null },
]

const attemptFor = {
  14: { assessmentAttemptId: 114, examId: 514, assessmentTitle: "Passport Mock Exam", assessmentType: "MOCK_EXAM", percentage: 100, passed: true, submittedAt: `${day(0)}T00:00:00` },
  21: { assessmentAttemptId: 121, examId: 521, assessmentTitle: "TOPCIT Software Quiz", assessmentType: "LESSON_QUIZ", percentage: 40, passed: false, submittedAt: `${day(4)}T00:00:00` },
}
const analyticsFor = (certificationId) => ({
  certificationId,
  certificationTitle: certificationId === 21 ? "TOPCIT" : "IT Passport Exam",
  completedLessonCount: certificationId === 21 ? 29 : 63,
  totalLessonCount: certificationId === 21 ? 64 : 63,
  passedAssessmentCount: certificationId === 21 ? 0 : 1,
  totalAssessmentCount: 96,
  totalAssessmentAttempts: 1,
  hasAssessmentActivity: true,
  averageAssessmentScore: attemptFor[certificationId].percentage,
  scoreTrend: [attemptFor[certificationId]],
  weakestTopics: [{ lessonTitle: certificationId === 21 ? "TOPCIT topic" : "Passport topic", masteryPercentage: 40 }],
})

const asked = []
const analyticsAsked = []
let browser
let respondToTopcit

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
    if (pathname.endsWith("/analytics")) {
      analyticsAsked.push(new URLSearchParams(search).get("certificationId"))
      if (certificationId === 21 && !respondToTopcit) {
        respondToTopcit = () => respond(analyticsFor(certificationId))
        return
      }
      return respond(analyticsFor(certificationId))
    }
    if (pathname.endsWith("/awards")) {
      return respond([{ certificationId: 14, certificationTitle: "Passport badge", badgeAwardedAt: `${day(2)}T00:00:00` }])
    }
    if (pathname === "/api/exams") {
      return respond([{ examId: attemptFor[certificationId].examId, certificationId }])
    }
    if (/\/departments\/\d+\/learners$/.test(pathname)) return respond(roster)
    if (/\/departments\/\d+$/.test(pathname)) {
      return respond({ departmentId: 1, name: "BSCS", certifications: [
        { certificationId: 14, title: "IT Passport Exam" }, { certificationId: 21, title: "TOPCIT" },
      ] })
    }
    if (pathname.endsWith("/integrity")) return respond({
      risk: "HIGH",
      attempts: [
        { attemptId: 115, examId: 514, examTitle: "Passport-only integrity event", copyPasteTries: 5, events: [] },
        { attemptId: 121, examId: 521, examTitle: "TOPCIT-only integrity event", exits: 1, events: [] },
      ],
    })
    return respond([])
  })

  const url = new URL(route, server.resolvedUrls.local[0])
  await page.goto(url.href, { waitUntil: "domcontentloaded" })

  const text = () => page.evaluate(() => document.body.innerText)
  const sidebar = () => page.$eval("aside", (element) => element.innerText)

  await page.waitForFunction(() => document.body.innerText.includes("Study behaviour this week"))
  await page.waitForFunction(() => document.body.innerText.includes("Passport-only integrity event"))
  await page.waitForFunction(() => document.body.innerText.includes("Passport badge"))
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
  const firstSidebar = await sidebar()
  assert.match(firstSidebar, /Mock exam passed · 100%/)
  assert.ok(firstSidebar.includes("Passport section") && firstSidebar.includes("Passport badge"))
  assert.match(firstSidebar, /63\/63 lessons/)
  assert.match(firstSidebar, /Last submitted attempt today/)
  assert.ok(shown.includes("Passport Mock Exam") && shown.includes("Passport topic"))
  assert.ok(!shown.includes("TOPCIT-only integrity event"))
  assert.deepEqual(analyticsAsked, ["14"], "even the default certification is requested explicitly")

  // The figures follow the certification tab.
  await page.locator("::-p-xpath(//button[normalize-space()='TOPCIT'])").click()
  assert.doesNotMatch(await text(), /Passport Mock Exam|Mock exam passed|Passport topic/, "previous results disappear while loading")
  assert.match(await sidebar(), /Export TOPCIT/)
  await page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent === "TOPCIT")
  for (let retry = 0; retry < 40 && !respondToTopcit; retry++) {
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  assert.ok(respondToTopcit, "the selected certification requested new analytics")
  await respondToTopcit()
  await page.waitForFunction(() => document.body.innerText.includes("TOPCIT-only integrity event"))
  await page.waitForFunction(() => document.body.innerText.includes("Steady pace"))
  const second = await text()
  const secondSidebar = await sidebar()
  assert.match(second, /90\s*min studied · 12 today/, "the other certification has its own week")
  assert.match(secondSidebar, /No mock exam attempt yet/)
  assert.match(secondSidebar, /29\/64 lessons/)
  assert.match(secondSidebar, /TOPCIT section/)
  assert.match(secondSidebar, /Last submitted attempt [45] days ago/)
  assert.match(secondSidebar, /Averaging 40%/)
  assert.doesNotMatch(secondSidebar, /Passport section|Passport badge|Possible cheating|Mock exam passed/)
  assert.match(second, /TOPCIT Software Quiz/)
  assert.match(second, /TOPCIT topic/)
  assert.doesNotMatch(second, /Passport-only integrity event|Passport Mock Exam|Passport topic/)
  assert.ok(asked.includes(21), "the second certification is asked for by id")
  assert.deepEqual(analyticsAsked, ["14", "21"])

  await page.locator("::-p-xpath(//button[normalize-space()='IT Passport Exam'])").click()
  await page.waitForFunction(() => document.body.innerText.includes("Passport Mock Exam"))
  assert.match(await sidebar(), /Mock exam passed · 100%/)
  assert.doesNotMatch(await text(), /TOPCIT Software Quiz|TOPCIT-only integrity event/)
  console.log("department-learner-study: results, study behaviour, sidebar, export, badges and integrity follow the selected certification")
} finally {
  await browser?.close()
  await server.close()
}
