// node src/lib/study-plan-events.check.mjs — the study-calendar scheduling rules.
import assert from "node:assert/strict"
import { planStudy } from "./study-plan-events.js"

function curriculum(count) {
  return Array.from({ length: count }, (_, i) => ({ lessonId: i + 1, title: `Lesson ${i + 1}`, completed: false }))
}

// Mastery spread so the weakest lessons are scattered through the curriculum, not at the start.
function masteryFor(count) {
  const map = {}
  for (let i = 1; i <= count; i += 1) map[String(i)] = (i * 37) % 100
  return map
}

const base = {
  calendarStart: "2026-11-11",
  studyDays: "5 days per week",
  studyWindow: "Evening",
  selectedTechniqueInfo: { id: "pomodoro" },
  readiness: "Ready 2 weeks before the exam",
}

// --- Exam too close: 58 lessons, ~3.5 weeks to the exam -------------------------------------
{
  const mastery = masteryFor(58)
  const { events, summary } = planStudy({
    ...base,
    targetExamDate: "2026-12-15",
    curriculum: curriculum(58),
    masteryByLesson: mastery,
  })

  assert.equal(summary.focusMode, true, "a near exam switches to focus mode")
  assert.equal(summary.warning, null, "focus mode replaces the old spill-over warning")
  const lessonEvents = events.filter((e) => e.type === "lesson")
  assert.ok(lessonEvents.length > 0)
  assert.equal(lessonEvents.length, summary.lessonsScheduled)
  assert.equal(summary.lessonsScheduled + summary.skippedLessons.length, 58, "every lesson is either taught or listed as skipped")

  // No new lesson eats into the review window before the exam.
  for (const event of lessonEvents) assert.ok(event.dateKey < summary.readinessOn, `${event.title} on ${event.dateKey} is after readiness`)

  // The taught lessons are the weakest ones, taught weakest first.
  const taught = lessonEvents.map((e) => mastery[String(e.lessonId)])
  const weakestSkipped = Math.min(...summary.skippedLessons.map((l) => l.mastery))
  assert.ok(Math.max(...taught) <= weakestSkipped, "nothing stronger than a skipped lesson is taught")
  assert.deepEqual(taught, [...taught].sort((a, b) => a - b), "weakest lessons come first")

  // Review and mock exams still happen before the exam.
  assert.ok(events.some((e) => e.type === "mock" && e.title === "Final mock exam"))
  assert.ok(events.some((e) => e.type === "review" && e.dateKey >= summary.readinessOn))

  assert.match(
    summary.focusNotice,
    new RegExp(`^Exam is near: focusing on your ${summary.lessonsScheduled} weakest lessons; ${summary.skippedLessons.length} stronger ones are skipped`)
  )
}

// --- Plenty of time: behaves as before, every lesson in order of need ------------------------
{
  const { events, summary } = planStudy({
    ...base,
    targetExamDate: "2027-06-30",
    curriculum: curriculum(58),
    masteryByLesson: masteryFor(58),
  })
  assert.equal(summary.focusMode, false)
  assert.equal(summary.focusNotice, null)
  assert.deepEqual(summary.skippedLessons, [])
  assert.equal(summary.warning, null)
  assert.equal(events.filter((e) => e.type === "lesson").length, 58)
  assert.ok(summary.lessonsEndOn < summary.readinessOn)
}

// --- Ties: same mastery -> BKT priority tag, then priority topics, then curriculum order ------
{
  const lessons = curriculum(40)
  const mastery = Object.fromEntries(lessons.map((l) => [String(l.lessonId), 50]))
  const { events, summary } = planStudy({
    ...base,
    targetExamDate: "2026-11-25",
    readiness: "Ready 1 week before the exam",
    curriculum: lessons,
    masteryByLesson: mastery,
    priorityByLesson: { 30: "CRITICAL_PRIORITY", 20: "HIGH_PRIORITY" },
    priorityTopics: ["Lesson 35"],
  })
  assert.equal(summary.focusMode, true)
  const order = events.filter((e) => e.type === "lesson").map((e) => e.lessonId)
  assert.deepEqual(order.slice(0, 4), [30, 20, 35, 1])
}

// --- No mastery data yet: falls back to priority order and says so --------------------------
{
  const { summary } = planStudy({ ...base, targetExamDate: "2026-12-01", curriculum: curriculum(58) })
  assert.equal(summary.focusMode, true)
  assert.match(summary.focusNotice, /focusing on \d+ priority lessons; \d+ others are skipped/)
  assert.match(summary.focusNotice, /Take a diagnostic/)
}

// --- Completed lessons are never scheduled or counted as skipped ----------------------------
{
  const lessons = curriculum(58).map((l, i) => ({ ...l, completed: i < 5 }))
  const { events, summary } = planStudy({
    ...base,
    targetExamDate: "2026-12-15",
    curriculum: lessons,
    masteryByLesson: masteryFor(58),
  })
  assert.equal(summary.lessonsToStudy, 53)
  const ids = new Set([...events.filter((e) => e.type === "lesson").map((e) => e.lessonId), ...summary.skippedLessons.map((l) => l.lessonId)])
  for (let i = 1; i <= 5; i += 1) assert.ok(!ids.has(i))
}

console.log("study-plan-events: all checks passed")
