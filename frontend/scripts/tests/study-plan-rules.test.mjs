/**
 * The rules read out of the "anything else" note have to reach the calendar:
 * days away hold no sessions, a lesson cap is obeyed, and a topic the learner
 * asked for first is scheduled first.
 */
import assert from "node:assert/strict"

import { mergeStudyPreferences, planStudy } from "../../src/lib/study-plan-events.js"

const curriculum = [
  { lessonId: 1, title: "Networking Basics", middleCategoryId: 1 },
  { lessonId: 2, title: "Information Security Principles", middleCategoryId: 2 },
  { lessonId: 3, title: "Databases", middleCategoryId: 3 },
  { lessonId: 4, title: "Algorithms", middleCategoryId: 4 },
]

const base = {
  calendarStart: "2027-01-04",
  targetExamDate: "2027-03-01",
  studyDays: "5 days per week",
  studyWindow: "Evening · 7:00 PM",
  studyWindowTimes: { "Evening · 7:00 PM": "19:00" },
  selectedTechniqueInfo: { id: "active-recall" },
  readiness: "Ready 2 weeks before the exam",
  curriculum,
}

const plan = (preferences) => planStudy({ ...base, preferences })

// A note that says nothing the planner understands leaves the keyword rules alone.
assert.equal(mergeStudyPreferences(null, null), null)
assert.deepEqual(mergeStudyPreferences({ days: [1, 3] }, null), { days: [1, 3] })

// The AI's rules win, and the keyword rules fill the gaps.
const merged = mergeStudyPreferences(
  { days: [1, 3], time: "07:00", shortSessions: true },
  { days: [2, 4], skipDates: ["2027-01-11"], priorityTopics: ["Databases"], applied: ["No Mondays"] },
)
assert.deepEqual(merged.days, [2, 4], "the AI's days replace the keyword days")
assert.equal(merged.time, "07:00", "a time only the keyword parser found is kept")
assert.equal(merged.shortSessions, true)
assert.deepEqual(merged.applied, ["No Mondays"])

// No AI access, no uses left, or the service down: the note is ignored outright,
// never half-applied from keywords.
assert.equal(
  mergeStudyPreferences({ days: [1, 3], shortSessions: true }, { unavailable: "You have used all 50 AI uses for today." }),
  null,
  "an unreadable note leaves the schedule as it was",
)

// Days the learner is away hold nothing at all.
const away = ["2027-01-11", "2027-01-12", "2027-01-13", "2027-01-14", "2027-01-15"]
const awayPlan = plan({ skipDates: away })
const scheduled = new Set(awayPlan.events.map((event) => event.dateKey))
for (const day of away) assert.ok(!scheduled.has(day), `${day} is a day away, so nothing is scheduled`)
assert.ok(awayPlan.events.length > 5, "the rest of the plan is still built")

// A lesson cap is obeyed on every day.
const capped = plan({ maxLessonsPerDay: 1 })
const lessonsPerDay = new Map()
for (const event of capped.events) {
  if (event.type !== "lesson") continue
  lessonsPerDay.set(event.dateKey, (lessonsPerDay.get(event.dateKey) ?? 0) + 1)
}
for (const [day, count] of lessonsPerDay) {
  assert.ok(count <= 1, `${day} has ${count} lessons, over the cap of 1`)
}

// What the learner asked to study first is studied first.
const first = (planned) =>
  planned.events.find((event) => event.type === "lesson")?.lessonTitle ?? null
assert.equal(first(plan(null)), "Networking Basics", "without a note the curriculum order stands")
assert.equal(
  first(plan({ priorityTopics: ["Information Security Principles"] })),
  "Information Security Principles",
  "a topic the note names is pulled to the front",
)

console.log("study-plan-rules: days away, lesson caps and asked-for topics all reach the calendar")
