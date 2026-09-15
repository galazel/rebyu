/**
 * Building a study plan: which lessons, on which days, and what each session
 * asks of the learner.
 *
 * The plan is built from the certification's real curriculum, not a handful of
 * topic names:
 *
 *   1. Every unfinished lesson is scheduled. Completed lessons are skipped.
 *      Weakest first (mastery under 40%), then untouched lessons in course
 *      order -- so prerequisites still come before what builds on them -- then
 *      the ones already partly known.
 *   2. The pace fits the calendar. Study days up to the readiness date
 *      ("Ready 2 weeks before the exam") are counted, and the lessons are
 *      spread over them: 1 to 3 per study day. If even 3 a day cannot cover
 *      them, the plan says so instead of quietly running out of days.
 *   3. Two phases. Learning until the readiness date; consolidation after it --
 *      reviews of the weakest lessons, weekly mock exams, a final mock five
 *      days out, and a light last day before the exam.
 *   4. The technique shapes each day: spaced repetition brings lessons back 1, 3
 *      and 7 days later; active recall adds a quiz on the previous day's
 *      lessons; Pomodoro sizes each lesson as focus blocks.
 *
 * Every event carries a `detail` sentence, so Today's plan and the calendar say
 * what to actually do.
 */

const DEFAULT_STUDY_TIME = "19:00"

/** Days before the exam that new lessons should be finished by. */
const READINESS_DAYS = {
  "Ready 1 week before the exam": 7,
  "Ready 2 weeks before the exam": 14,
  "Ready 1 month before the exam": 30,
  "Steady long-term review": 3,
}

const MAX_LESSONS_PER_DAY = 3
const WEAK_MASTERY = 40
const PARTLY_KNOWN_MASTERY = 70
/** Completed lessons below this are still reviewed in consolidation. */
const REVIEW_MASTERY = 60
const SPACED_REVIEW_OFFSETS = [1, 3, 7]
const MAX_REVIEWS_PER_DAY = 2
const FINAL_MOCK_DAYS_OUT = 5
const MAX_EVENTS = 500

const LESSON_DETAIL = {
  "spaced-repetition":
    "Study the lesson, then turn its key terms into flashcards. It comes back as short reviews 1, 3 and 7 days from now.",
  "active-recall":
    "Read the lesson once, close it, and write down everything you remember. Then open it again and fill in what you missed.",
  pomodoro:
    "Study in 25-minute focus blocks with a 5-minute break between them. Two blocks is enough for one lesson.",
}

const LESSON_MINUTES = { "spaced-repetition": 40, "active-recall": 40, pomodoro: 55 }

const MOCK_DETAIL =
  "A timed practice test built from every lesson you have finished in this certification so far. " +
  "It shows what you still remember and which topics need another look."

function dayKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/** "07:30" -> "7:30 AM". Null for anything that is not a valid HH:mm. */
function clockLabel(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? "").trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  const suffix = hours < 12 ? "AM" : "PM"
  return `${hours % 12 === 0 ? 12 : hours % 12}:${match[2]} ${suffix}`
}

function studyDaysPerWeek(value) {
  if (value === "Every day") return 7
  const match = String(value ?? "").match(/\d+/)
  return match ? Number(match[0]) : 5
}

/** A lesson as the planner handles it, from a curriculum row, a topic ref, or a plain title. */
function toLesson(row, masteryByLesson) {
  if (typeof row === "string") {
    return { lessonId: null, middleCategoryId: null, title: row.trim(), completed: false, mastery: null }
  }
  const lessonId = row?.lessonId ?? null
  const raw = lessonId == null ? null : masteryByLesson?.[String(lessonId)]
  const mastery = raw == null || raw === "" || !Number.isFinite(Number(raw)) ? null : Number(raw)
  return {
    lessonId,
    middleCategoryId: row?.middleCategoryId ?? null,
    title: String(row?.title ?? row?.name ?? row?.lessonTitle ?? "Lesson").trim(),
    completed: Boolean(row?.completed),
    mastery,
  }
}

/** Weakest first, then untouched in course order, then partly known, then strong. */
function studyRank(lesson) {
  if (lesson.mastery == null) return 1
  if (lesson.mastery < WEAK_MASTERY) return 0
  return lesson.mastery < PARTLY_KNOWN_MASTERY ? 2 : 3
}

/**
 * Builds a plan's sessions and a summary of its pace.
 *
 * @param curriculum       the certification's lessons in course order, each
 *   `{ lessonId, middleCategoryId, name|title, completed }`
 * @param masteryByLesson  `{ [lessonId]: mastery % }` from the analytics service
 * @param readiness        one of the form's readiness options
 * @param priorityTopics   used only when there is no curriculum to plan from
 * @param studyTime        an exact "HH:mm" for this schedule (per certification)
 * @returns {{ events: object[], summary: object }}
 */
export function planStudy({
  calendarStart,
  targetExamDate,
  studyDays,
  studyWindow,
  studyWindowTimes = {},
  studyTime = null,
  selectedTechniqueInfo,
  priorityTopics = [],
  curriculum = null,
  masteryByLesson = {},
  readiness = null,
}) {
  const exactTime = clockLabel(studyTime) ? String(studyTime).trim().padStart(5, "0") : null
  const at = exactTime ?? studyWindowTimes[studyWindow] ?? DEFAULT_STUDY_TIME
  const timeLabel = exactTime ? clockLabel(exactTime) : studyWindow
  const technique = selectedTechniqueInfo?.id ?? null
  const startDate = new Date(`${calendarStart}T00:00:00`)
  const examDate = new Date(`${targetExamDate}T00:00:00`)
  const perWeek = studyDaysPerWeek(studyDays)
  const totalDays = daysBetween(startDate, examDate)

  const examEvent = {
    id: "target-exam",
    dateKey: dayKey(examDate),
    title: "Exam day",
    type: "exam",
    time: "Exam day",
    detail: "The day of your certification exam. Rest well the night before -- no new studying today.",
  }

  /* ---- what to study ------------------------------------------------------ */
  const source = Array.isArray(curriculum) && curriculum.length > 0 ? curriculum : priorityTopics ?? []
  const seen = new Set()
  const lessons = []
  for (const row of source) {
    const lesson = toLesson(row, masteryByLesson)
    const key = lesson.lessonId != null ? `id:${lesson.lessonId}` : `title:${lesson.title}`
    if (!lesson.title || seen.has(key)) continue
    seen.add(key)
    lessons.push({ ...lesson, order: lessons.length })
  }

  const toStudy = lessons
    .filter((lesson) => !lesson.completed)
    .sort(
      (a, b) =>
        studyRank(a) - studyRank(b) ||
        (studyRank(a) === 0 ? a.mastery - b.mastery : a.order - b.order)
    )
  if (toStudy.length === 0 && lessons.length === 0) {
    toStudy.push({ lessonId: null, middleCategoryId: null, title: "Core certification lesson", mastery: null, order: 0 })
  }

  // Weakest known lessons first; completed-but-shaky ones included.
  const weakPool = lessons
    .filter((lesson) => lesson.mastery != null && lesson.mastery < REVIEW_MASTERY)
    .sort((a, b) => a.mastery - b.mastery)

  const summaryBase = {
    lessonsTotal: lessons.length,
    lessonsCompleted: lessons.filter((lesson) => lesson.completed).length,
    lessonsToStudy: toStudy.length,
  }

  if (!(totalDays > 0)) {
    return {
      events: [examEvent],
      summary: { ...summaryBase, lessonsPerDay: 0, lessonsEndOn: null, mockCount: 0, warning: "The exam date must be after the start date." },
    }
  }

  /* ---- which days are study days (same rule the main loop uses) ------------ */
  const studyFlags = []
  {
    const cursor = new Date(startDate)
    let weekly = 0
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
      const weekday = cursor.getDay()
      const isStudy = perWeek === 7 || (weekday !== 0 && weekly < perWeek)
      studyFlags.push(isStudy)
      if (isStudy) weekly += 1
      if (weekday === 6) weekly = 0
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  /* ---- the pace ----------------------------------------------------------- */
  // Consolidation gets the readiness days, but never more than 40% of the plan.
  const consolidationDays = Math.min(READINESS_DAYS[readiness] ?? 7, Math.floor(totalDays * 0.4))
  const learningEndIndex = Math.max(1, totalDays - consolidationDays)
  const learningStudyDays = Math.max(1, studyFlags.slice(0, learningEndIndex).filter(Boolean).length)
  const lessonsPerDay = Math.min(MAX_LESSONS_PER_DAY, Math.max(1, Math.ceil(toStudy.length / learningStudyDays)))
  /* Fewer lessons than study days: space them out so new material keeps coming
     up to the readiness date, with lighter review days in between -- instead of
     cramming every lesson into the first weeks and then reviewing the same few
     for two months. At most two review days between lessons. */
  const studyGap =
    lessonsPerDay > 1 ? 1 : Math.min(3, Math.max(1, Math.floor(learningStudyDays / Math.max(1, toStudy.length))))
  const warning =
    toStudy.length > learningStudyDays * MAX_LESSONS_PER_DAY
      ? `${toStudy.length} lessons do not fit before your readiness date even at ${MAX_LESSONS_PER_DAY} a day, so some run into review time. Add study days or choose a later exam date.`
      : null

  /* ---- the days ----------------------------------------------------------- */
  const events = []
  const base = (date) => ({ dateKey: dayKey(date), time: timeLabel, at, technique })
  const lessonFields = (lesson) => ({
    lessonId: lesson.lessonId ?? null,
    middleCategoryId: lesson.middleCategoryId ?? null,
    lessonTitle: lesson.title,
  })

  let sessionNumber = 0
  let queueIndex = 0
  let lessonsEndIndex = null
  let previousDayLessons = []
  let lastMockDay = -99
  let midpointMockPlaced = toStudy.length < 6 // too few lessons for a midpoint check
  let readinessMockPlaced = false
  let finalMockPlaced = totalDays < 10
  let consolidationCursor = 0
  let learningDayIndex = 0
  let betweenCursor = 0
  const studied = []
  const reviewQueue = [] // { lesson, dueDay, round }

  const current = new Date(startDate)
  for (let dayIndex = 0; dayIndex < totalDays && events.length < MAX_EVENTS; dayIndex += 1, current.setDate(current.getDate() + 1)) {
    const daysLeft = totalDays - dayIndex
    const weekday = current.getDay()

    if (studyFlags[dayIndex]) {
      sessionNumber += 1
      const id = `event-${sessionNumber}`
      const inConsolidation = dayIndex >= learningEndIndex
      const lessonsLeft = queueIndex < toStudy.length

      /* -- mock exams -- */
      const mockReason =
        daysLeft <= FINAL_MOCK_DAYS_OUT && daysLeft >= 2 && !finalMockPlaced
          ? "final"
          : !midpointMockPlaced && queueIndex >= Math.ceil(toStudy.length / 2)
            ? "midpoint"
            : inConsolidation && !readinessMockPlaced
              ? "readiness"
              : inConsolidation && !lessonsLeft && dayIndex - lastMockDay >= 7 && daysLeft > FINAL_MOCK_DAYS_OUT + 2
                ? "weekly"
                : null

      if (mockReason && (mockReason === "final" || dayIndex - lastMockDay >= 3)) {
        if (mockReason === "final") finalMockPlaced = true
        if (mockReason === "midpoint") midpointMockPlaced = true
        if (mockReason === "readiness") readinessMockPlaced = true
        lastMockDay = dayIndex
        events.push({
          id: `${id}-mock`,
          ...base(current),
          type: "mock",
          title:
            mockReason === "final"
              ? "Final mock exam"
              : mockReason === "midpoint"
                ? "Halfway mock exam"
                : "Mock exam",
          detail: MOCK_DETAIL,
          minutes: null,
          lessonId: null,
          lessonTitle: null,
        })
      } else if (daysLeft === 1) {
        /* -- the day before the exam: light, weakest two only -- */
        weakPool.slice(0, 2).forEach((lesson, k) =>
          events.push({
            id: `${id}-final-${k}`,
            ...base(current),
            type: "review",
            title: `Final review: ${lesson.title}`,
            detail: "A light last look at one of your weakest topics. No new material and no late night -- rest matters more now.",
            minutes: 20,
            ...lessonFields(lesson),
          })
        )
      } else if (lessonsLeft && learningDayIndex % studyGap === 0) {
        /* -- learning: today's lessons, at the planned pace -- */
        const todays = toStudy.slice(queueIndex, queueIndex + lessonsPerDay)
        queueIndex += todays.length
        if (queueIndex >= toStudy.length) lessonsEndIndex = dayIndex

        todays.forEach((lesson, k) => {
          events.push({
            id: todays.length === 1 ? id : `${id}-l${k + 1}`,
            ...base(current),
            type: "lesson",
            title: lesson.title,
            detail:
              (lesson.mastery != null && lesson.mastery < WEAK_MASTERY
                ? `One of your weakest topics (${Math.round(lesson.mastery)}% mastery). `
                : "") + (LESSON_DETAIL[technique] ?? "Work through this lesson and its practice questions."),
            minutes: LESSON_MINUTES[technique] ?? 40,
            ...lessonFields(lesson),
          })

          if (technique === "spaced-repetition") {
            SPACED_REVIEW_OFFSETS.forEach((offset, round) =>
              reviewQueue.push({ lesson, dueDay: dayIndex + offset, round: round + 1 })
            )
          }
        })

        if (technique === "active-recall" && previousDayLessons.length > 0) {
          const recalled = previousDayLessons[0]
          events.push({
            id: `${id}-recall`,
            ...base(current),
            type: "quiz",
            title: `Recall quiz: ${recalled.title}`,
            detail: "Answer questions on yesterday's lesson without looking at notes. Only check the lesson after you have answered.",
            minutes: 15,
            ...lessonFields(recalled),
          })
        }
        previousDayLessons = todays
        studied.push(...todays)
      } else if (lessonsLeft) {
        /* -- a day between lessons: go back over one of the last few lessons.
           Spaced repetition already schedules its own reviews for these days. -- */
        if (technique !== "spaced-repetition" && studied.length > 0) {
          const recent = studied.slice(-3)
          const lesson = recent[betweenCursor % recent.length]
          betweenCursor += 1
          events.push({
            id: `${id}-between`,
            ...base(current),
            type: technique === "active-recall" ? "quiz" : "review",
            title: technique === "active-recall" ? `Recall quiz: ${lesson.title}` : `Review: ${lesson.title}`,
            detail:
              technique === "active-recall"
                ? "A lighter day: answer questions on a recent lesson from memory, then check what you missed."
                : "A lighter day: reread your notes on a recent lesson and redo any questions you got wrong.",
            minutes: 20,
            ...lessonFields(lesson),
          })
        }
      } else {
        /* -- consolidation: the weakest lessons again, then everything studied -- */
        const pool = weakPool.length > 0 ? weakPool : toStudy
        const picks = []
        for (let k = 0; k < Math.min(MAX_REVIEWS_PER_DAY, pool.length); k += 1) {
          picks.push(pool[consolidationCursor % pool.length])
          consolidationCursor += 1
        }
        picks.forEach((lesson, k) =>
          events.push({
            id: `${id}-consolidate-${k}`,
            ...base(current),
            type: "review",
            title: `Review: ${lesson.title}`,
            detail:
              technique === "active-recall"
                ? "Test yourself on this topic from memory first, then reread only the parts you got wrong."
                : "Go back over this topic and redo the questions you got wrong. Your readiness date has passed -- this is the time to fix weak spots.",
            minutes: 25,
            ...lessonFields(lesson),
          })
        )
      }

      if (lessonsLeft) learningDayIndex += 1

      /* -- spaced reviews that have come due (not on mock or final days) -- */
      if (technique === "spaced-repetition" && !events[events.length - 1]?.id.endsWith("-mock") && daysLeft > 1) {
        const todaysIds = new Set(
          events.filter((event) => event.dateKey === dayKey(current)).map((event) => event.lessonTitle)
        )
        reviewQueue.sort((a, b) => a.dueDay - b.dueDay)
        let served = 0
        for (let i = 0; i < reviewQueue.length && served < MAX_REVIEWS_PER_DAY; ) {
          const entry = reviewQueue[i]
          if (entry.dueDay > dayIndex) break
          if (todaysIds.has(entry.lesson.title)) {
            i += 1
            continue
          }
          reviewQueue.splice(i, 1)
          served += 1
          events.push({
            id: `${id}-review-${served}`,
            ...base(current),
            type: "review",
            title: `Review: ${entry.lesson.title}`,
            detail: `Flashcard review ${entry.round} of 3. Try to recall each answer before you flip the card.`,
            minutes: 15,
            ...lessonFields(entry.lesson),
          })
        }
      }
    }

    if (weekday === 6 && perWeek < 7 && daysLeft > 1) {
      events.push({
        id: `catch-up-${dayKey(current)}`,
        ...base(current),
        type: "catch-up",
        title: "Weekly catch-up",
        detail: "Finish any session you missed this week. If you are up to date, go through your mistake bank instead.",
        minutes: 30,
      })
    }
  }

  events.push(examEvent)

  const lessonsEndOn =
    lessonsEndIndex == null ? null : dayKey(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + lessonsEndIndex))

  return {
    events,
    summary: {
      ...summaryBase,
      lessonsPerDay,
      lessonsEndOn,
      readinessOn: dayKey(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + learningEndIndex)),
      mockCount: events.filter((event) => event.type === "mock").length,
      unscheduledLessons: Math.max(0, toStudy.length - queueIndex),
      warning:
        warning ??
        (queueIndex < toStudy.length
          ? `${toStudy.length - queueIndex} lessons did not fit before the exam. Add study days or choose a later exam date.`
          : null),
    },
  }
}

/** The sessions alone, for callers that do not need the summary. */
export function generateStudyEvents(options) {
  return planStudy(options).events
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
      return MOCK_DETAIL
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
