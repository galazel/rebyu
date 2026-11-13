// node src/lib/export-format.check.mjs — the rules every CSV export follows.
import assert from "node:assert/strict"
import { cellValue, hasData, prepareExport, tableFromObjects } from "./export-format.js"
import { toCsv } from "./csv.js"

const now = new Date(2026, 10, 6, 14, 5)

// Cells
assert.equal(cellValue(true), "Yes")
assert.equal(cellValue(false), "No")
assert.equal(cellValue(null), "")
assert.equal(cellValue(36.6666), 36.7)
assert.equal(cellValue(12), 12)
assert.equal(cellValue(Number.NaN), "")
assert.equal(cellValue("2026-11-06"), "2026-11-06")
assert.equal(cellValue("2026-10-01T12:34:56.789"), "2026-10-01 12:34", "server LocalDateTime keeps its clock time")
assert.equal(cellValue("2026-10-01 08:00"), "2026-10-01 08:00")
assert.equal(cellValue([{ title: "IT Passport" }, { title: "FE" }]), "IT Passport / FE")
assert.equal(cellValue(["a", "b"]), "a / b")
assert.equal(cellValue({ code: "BSIT", seats: 3 }), "Code: BSIT; Seats: 3")
assert.equal(cellValue("plain text"), "plain text")

// Generic tables keep every field, in first-seen order, normalised later
const table = tableFromObjects("Rows", [{ learnerId: 1, active: true }, { learnerId: 2, lastSeenAt: "2026-01-02T03:04:05" }])
assert.deepEqual(table.columns, ["Learner Id", "Active", "Last Seen At"])
assert.equal(table.rows.length, 2)

// Every file opens with the same About block; cells are normalised; empty blocks drop out
const blocks = prepareExport(
  "Department roster",
  [
    { title: "Learners", columns: ["Name", "Mock passed", "Score (%)"], rows: [["Ana", true, 61.25]] },
    { title: "Empty", columns: ["X"], rows: [] },
    null,
  ],
  [["Department", "CCS"], ["Search", null]],
  now
)
assert.equal(blocks[0].title, "About this export")
assert.deepEqual(blocks[0].rows, [["Report", "Department roster"], ["Exported at", "2026-11-06 14:05"], ["Department", "CCS"]])
assert.deepEqual(blocks[1].rows, [["Ana", "Yes", 61.3]])
assert.equal(blocks.length, 3, "header-only blocks with a title are kept so the reader sees the section exists")

assert.equal(hasData([{ title: "x", rows: [] }]), false)
assert.equal(hasData([{ title: "x", rows: [[1]] }]), true)

const csv = toCsv(blocks)
assert.ok(csv.startsWith("About this export\r\nField,Value\r\nReport,Department roster"))
assert.ok(csv.includes("Ana,Yes,61.3"))

// Learner analytics: one row per assessment, attempts across columns
const { assessmentSummary, learnerReportBlocks, topicRows } = await import("./learner-export.js")
const trend = [
  { examId: 7, attemptNumber: 2, assessmentTitle: "Legal Affairs Exam", assessmentType: "MIDDLE_EXAM", percentage: 25, passed: false, correctCount: 5, itemCount: 20, submittedAt: "2026-09-21T10:00:00" },
  { examId: 7, attemptNumber: 1, assessmentTitle: "Legal Affairs Exam", assessmentType: "MIDDLE_EXAM", percentage: 10, passed: false, correctCount: 2, itemCount: 20, submittedAt: "2026-09-20T10:00:00" },
  { examId: 7, attemptNumber: 3, assessmentTitle: "Legal Affairs Exam", assessmentType: "MIDDLE_EXAM", percentage: 100, passed: true, correctCount: 20, itemCount: 20, submittedAt: "2026-09-29T10:00:00" },
  { examId: 9, attemptNumber: 1, assessmentTitle: "Marketing Quiz", assessmentType: "LESSON_QUIZ", percentage: 100, passed: true, correctCount: 10, itemCount: 10, submittedAt: "2026-09-29T11:00:00" },
  { examId: 9, attemptNumber: 2, assessmentTitle: "Marketing Quiz", assessmentType: "LESSON_QUIZ", percentage: null },
]
const summary = assessmentSummary(trend)
assert.equal(summary.rows.length, 2, "one row per assessment, not per attempt")
assert.deepEqual(summary.columns.slice(-3), ["Attempt 1 (%)", "Attempt 2 (%)", "Attempt 3 (%)"])
const legal = summary.rows[0]
assert.equal(legal[0], "Legal Affairs Exam")
assert.equal(legal[1], "Topic exam")
assert.equal(legal[2], 3, "attempts")
assert.deepEqual(legal.slice(3, 7), [10, 100, 100, 90], "first, best, latest, change")
assert.equal(legal[7], true, "passed")
assert.equal(legal[8], 3, "passed on attempt 3")
assert.equal(legal[9], "2026-09-20T10:00:00")
assert.equal(legal[10], "2026-09-29T10:00:00")
assert.equal(legal[11], "20/20")
assert.deepEqual(legal.slice(-3), [10, 25, 100], "attempts in order")
const quiz = summary.rows[1]
assert.equal(quiz[2], 1, "ungraded attempts are not counted")
assert.equal(quiz[6], null, "no change with one attempt")
assert.deepEqual(quiz.slice(-3), [100, null, null])

const withPrefix = assessmentSummary(trend, { prefixColumns: ["Learner"], prefix: ["Ana"], maxAttempts: 5 })
assert.equal(withPrefix.columns[0], "Learner")
assert.equal(withPrefix.rows[0][0], "Ana")
assert.equal(withPrefix.columns.filter((c) => c.startsWith("Attempt ")).length, 5)

const topics = topicRows({
  weakestTopics: [{ lessonId: 1, lessonTitle: "Security", masteryPercentage: 7.4 }],
  lessonPriorities: [{ lessonId: 1, lessonTitle: "Security", masteryPercentage: 7.4 }, { lessonId: 2, lessonTitle: "SLA", masteryPercentage: 60 }],
})
assert.equal(topics.length, 2, "topics deduplicated across lists")
assert.equal(topics[0][2], 7, "weakest first, rounded")

const report = learnerReportBlocks({ scoreTrend: trend, completedLessonCount: 3, totalLessonCount: 63 }, [["Learner", "Ana"]])
assert.equal(report[0].rows[0][1], "Ana")
assert.ok(report.some((block) => block.title.startsWith("Assessments (one row each)")))
assert.ok(hasData(report))

// Rich learner analytics with student profile, behavior, plan, and attempt history
const masteryTrend = [
  { occurredAt: "2026-09-25T14:30:00", lessonId: 101, lessonTitle: "Network Security", previousMastery: 20, newMastery: 65, newMasteryLevel: "PRACTICED", assessmentType: "MODULE_EXAM" }
]
const richReport = learnerReportBlocks(
  {
    scoreTrend: trend,
    masteryTrend,
    completedLessonCount: 5,
    totalLessonCount: 20,
    highestPriorityTopicCount: 2,
    bktAvailable: true,
  },
  {
    student: {
      name: "Juan Dela Cruz",
      email: "juan@example.com",
      learnerId: 42,
      institution: "Technological University",
      department: "College of Computing",
      section: "BSIT-4A",
    },
    certification: { title: "IT Passport", code: "IT-PASS", certificationId: 13 },
    behavior: {
      weekStudyMinutes: 145,
      focusConsistency: 92,
      readingPace: "Steady",
      challengeCompletions: 8,
      rushEvents: 1,
    },
    plan: {
      planTitle: "October Exam Sprint",
      targetExamDate: "2026-10-30",
      dailyGoalMinutes: 45,
      status: "ACTIVE",
    },
  }
)

assert.ok(richReport.some((b) => b.title === "Summary"))
assert.ok(richReport.some((b) => b.title === "Study plan & goals"))
assert.ok(richReport.some((b) => b.title === "Study behavior & telemetry"))
assert.ok(richReport.some((b) => b.title === "Assessment attempt history (all attempts)"))
assert.ok(richReport.some((b) => b.title === "Mastery history trend"))

const summaryBlock = richReport.find((b) => b.title === "Summary")
const summaryMap = new Map(summaryBlock.rows)
assert.equal(summaryMap.get("Learner"), "Juan Dela Cruz")
assert.equal(summaryMap.get("Learner email"), "juan@example.com")
assert.equal(summaryMap.get("Learner ID"), 42)
assert.equal(summaryMap.get("Institution"), "Technological University")
assert.equal(summaryMap.get("Certification ID"), 13)
assert.equal(summaryMap.get("Highest priority topics"), 2)
assert.equal(summaryMap.get("Mastery tracking active"), "Yes")

const { buildXlsxWorkbook } = await import("./xlsx.js")
const prepared = prepareExport("Learner progress analytics", richReport, [["Learner", "Juan Dela Cruz"]])
const xlsxZip = buildXlsxWorkbook(prepared)
assert.ok(xlsxZip.file("xl/workbook.xml"))
assert.ok(xlsxZip.file("xl/styles.xml"))

console.log("export-format: all checks passed")
