/**
 * Building a study plan's sessions, and saying what each one asks of the learner.
 *
 * The technique the learner picks changes the schedule itself, not just a
 * label on it:
 *
 *   - spaced repetition  every lesson comes back as a short review 1, 3 and 7
 *                        days later -- the spacing is the technique
 *   - active recall      every other study day adds a quiz on the previous
 *                        topic, answered from memory before checking
 *   - pomodoro           one lesson a day, studied in 25-minute focus blocks
 *
 * Mock exams are placed by date (about every two weeks, plus a final one the
 * week before the exam) rather than "every 12th session", which put them
 * wherever the count happened to land -- sometimes the day before the exam,
 * sometimes never.
 *
 * Every event carries a `detail` sentence, so the tile and the calendar can say
 * what to actually do instead of printing a bare "Mock exam checkpoint".
 */

const DEFAULT_STUDY_TIME = "19:00"

/** Days after a lesson that its spaced reviews fall on. */
const SPACED_REVIEW_OFFSETS = [1, 3, 7]

/** A mock roughly this often, counted in calendar days. */
const MOCK_EVERY_DAYS = 14

/** The last few days are for going over weak topics, not new ones. */
const FINAL_REVIEW_DAYS = 3

/** A hard cap on events, so a years-long plan cannot store thousands. */
const MAX_EVENTS = 220

const LESSON_DETAIL = {
  "spaced-repetition":
    "Study the lesson, then turn its key terms into flashcards. It comes back as short reviews 1, 3 and 7 days from now.",
  "active-recall":
    "Read the lesson once, close it, and write down everything you remember. Then open it again and fill in what you missed.",
  pomodoro:
    "Study in 25-minute focus blocks with a 5-minute break between them. Two blocks is enough for one lesson.",
}

const LESSON_MINUTES = { "spaced-repetition": 40, "active-recall": 40, pomodoro: 55 }

function dayKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

function studyDaysPerWeek(value) {
  if (value === "Every day") return 7
  const match = String(value ?? "").match(/\d+/)
  return match ? Number(match[0]) : 5
}

/**
 * @param studyWindowTimes  the form's "Evening · 7:00 PM" -> "19:00" map, passed
 *   in so the words and the machine time stay defined in one place
 */
export function generateStudyEvents({
  calendarStart,
  targetExamDate,
  studyDays,
  studyWindow,
  studyWindowTimes = {},
  selectedTechniqueInfo,
  priorityTopics,
}) {
  const at = studyWindowTimes[studyWindow] ?? DEFAULT_STUDY_TIME
  const technique = selectedTechniqueInfo?.id ?? null
  const startDate = new Date(`${calendarStart}T00:00:00`)
  const examDate = new Date(`${targetExamDate}T00:00:00`)
  const perWeek = studyDaysPerWeek(studyDays)
  const totalDays = daysBetween(startDate, examDate)

  /* Lessons, not just their names -- a recall or flashcard session asks the
     server for that lesson's questions by id. */
  const topics =
    Array.isArray(priorityTopics) && priorityTopics.length > 0
      ? priorityTopics
      : [{ lessonId: null, title: "Core certification lesson" }]

  const events = []
  const base = (date) => ({ dateKey: dayKey(date), time: studyWindow, at, technique })

  let sessionNumber = 1
  let lessonCount = 0
  let weeklyStudyCount = 0
  let lastMockDay = 0
  let finalMockPlaced = false
  let finalReviewIndex = 0
  let previousTopic = null
  /* Reviews owed, earliest first: { topic, dueDay, round }. One is taken per
     study day so a busy week spreads out instead of stacking five reviews on
     one evening. */
  const reviewQueue = []

  const current = new Date(startDate)

  while (current <= examDate && events.length < MAX_EVENTS) {
    const dayIndex = daysBetween(startDate, current)
    const daysLeft = daysBetween(current, examDate)
    const weekday = current.getDay()

    if (daysLeft === 0) break // exam day gets its own marker below

    const isStudyDay = perWeek === 7 || (weekday !== 0 && weeklyStudyCount < perWeek)

    if (isStudyDay) {
      const id = `event-${sessionNumber}`

      const mockDue =
        totalDays >= 10 &&
        ((daysLeft <= 7 && daysLeft > FINAL_REVIEW_DAYS && !finalMockPlaced) ||
          (dayIndex - lastMockDay >= MOCK_EVERY_DAYS && daysLeft > 10))

      if (mockDue) {
        if (daysLeft <= 7) finalMockPlaced = true
        lastMockDay = dayIndex
        events.push({
          id,
          ...base(current),
          type: "mock",
          title: daysLeft <= 7 ? "Final mock exam" : "Mock exam",
          detail:
            "Take a full, timed practice test for this certification, the way you would sit the real exam. " +
            "Your score updates your exam readiness and shows which topics still need work.",
          minutes: null,
          lessonId: null,
          lessonTitle: null,
        })
      } else if (daysLeft <= FINAL_REVIEW_DAYS) {
        // Weakest topics first: the priority list is already in that order.
        const topic = topics[finalReviewIndex % topics.length]
        finalReviewIndex += 1
        events.push({
          id,
          ...base(current),
          type: "review",
          title: `Final review: ${topic.title}`,
          detail:
            "No new lessons this close to the exam. Go over this weak topic once more and redo the questions you got wrong.",
          minutes: 30,
          lessonId: topic.lessonId ?? null,
          lessonTitle: topic.title,
        })
      } else {
        const topic = topics[lessonCount % topics.length]
        lessonCount += 1
        events.push({
          id,
          ...base(current),
          type: "lesson",
          title: topic.title,
          detail: LESSON_DETAIL[technique] ?? "Work through this lesson and its practice questions.",
          minutes: LESSON_MINUTES[technique] ?? 40,
          lessonId: topic.lessonId ?? null,
          lessonTitle: topic.title,
        })

        if (technique === "spaced-repetition") {
          /* Studying a topic again restarts its spacing: the reviews still owed
             from last time would only repeat what today's lesson just did. */
          for (let i = reviewQueue.length - 1; i >= 0; i -= 1) {
            if (reviewQueue[i].topic.title === topic.title) reviewQueue.splice(i, 1)
          }
          SPACED_REVIEW_OFFSETS.forEach((offset, round) =>
            reviewQueue.push({ topic, dueDay: dayIndex + offset, round: round + 1 })
          )
        }

        if (technique === "active-recall" && previousTopic && lessonCount % 2 === 0) {
          events.push({
            id: `${id}-recall`,
            ...base(current),
            type: "quiz",
            title: `Recall quiz: ${previousTopic.title}`,
            detail:
              "Answer questions on your last topic without looking at notes. Only check the lesson after you have answered.",
            minutes: 15,
            lessonId: previousTopic.lessonId ?? null,
            lessonTitle: previousTopic.title,
          })
        }

        previousTopic = topic
      }

      /* One spaced review a day, on any study day it has come due by -- a
         review due on a Sunday off simply waits for the next study day. Never
         the topic studied today, which was just covered. */
      reviewQueue.sort((a, b) => a.dueDay - b.dueDay)
      const todaysTopic = events[events.length - 1]?.lessonTitle
      const reviewIndex = reviewQueue.findIndex(
        (entry) => entry.dueDay <= dayIndex && entry.topic.title !== todaysTopic
      )
      if (reviewIndex >= 0 && daysLeft > FINAL_REVIEW_DAYS) {
        const [review] = reviewQueue.splice(reviewIndex, 1)
        events.push({
          id: `${id}-review`,
          ...base(current),
          type: "review",
          title: `Review: ${review.topic.title}`,
          detail: `Flashcard review ${review.round} of 3. Try to recall each answer before you flip the card.`,
          minutes: 15,
          lessonId: review.topic.lessonId ?? null,
          lessonTitle: review.topic.title,
        })
      }

      sessionNumber += 1
      weeklyStudyCount += 1
    }

    if (weekday === 6) {
      if (perWeek < 7) {
        events.push({
          id: `catch-up-${dayKey(current)}`,
          ...base(current),
          type: "catch-up",
          title: "Weekly catch-up",
          detail:
            "Finish any session you missed this week. If you are up to date, go through your mistake bank instead.",
          minutes: 30,
        })
      }
      weeklyStudyCount = 0
    }

    current.setDate(current.getDate() + 1)
  }

  events.push({
    id: "target-exam",
    dateKey: dayKey(examDate),
    title: "Exam day",
    type: "exam",
    time: "Exam day",
    detail: "The day of your certification exam. Rest well the night before -- no new studying today.",
  })

  return events
}

/** How each event type reads, for plans old and new. */
export const EVENT_TYPE_LABELS = {
  lesson: "lesson",
  review: "review",
  quiz: "recall quiz",
  mock: "mock exam",
  "catch-up": "catch-up",
  exam: "exam day",
}

/**
 * Plans saved before events carried a `detail` still need to say what a
 * session is -- the "Mock exam checkpoint" on an older plan in particular,
 * which never explained itself. The target-exam marker was also typed "mock"
 * back then, so it is recognised by id.
 */
export function eventKind(event) {
  return event?.id === "target-exam" || String(event?.id ?? "").endsWith("-target-exam")
    ? "exam"
    : event?.type ?? "lesson"
}

export function describeEvent(event) {
  if (event?.detail) return event.detail

  switch (eventKind(event)) {
    case "mock":
      return (
        "Take a full, timed practice test for this certification, the way you would sit the real exam. " +
        "Your score updates your exam readiness and shows which topics still need work."
      )
    case "exam":
      return "The day of your certification exam."
    case "quiz":
      return "Answer practice questions from memory before checking the lesson."
    case "review":
      return "Go back over a topic you already studied so it stays in memory."
    case "catch-up":
      return "Finish any session you missed this week."
    default:
      return LESSON_DETAIL[event?.technique] ?? "Work through this lesson and its practice questions."
  }
}
