/*
 * Learner analytics (the progress-analytics response) as CSV blocks. Pure: no app
 * imports, so the rules are checked by export-format.check.mjs.
 *
 * Attempts are summarised ONE ROW PER ASSESSMENT — first, best and latest score,
 * when it was first passed, and every attempt's score across columns — instead of
 * one row per attempt, which repeated each assessment's name over and over.
 */

const TYPE_LABEL = {
  LESSON_QUIZ: "Lesson quiz",
  MIDDLE_EXAM: "Topic exam",
  MODULE_EXAM: "Module exam",
  MAJOR_EXAM: "Major exam",
  MOCK_EXAM: "Mock exam",
  DIAGNOSTIC: "Diagnostic",
}

export function assessmentTypeLabel(type) {
  if (!type) return ""
  if (TYPE_LABEL[type]) return TYPE_LABEL[type]
  const words = String(type).replaceAll("_", " ").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const round = (value) => (value == null || value === "" ? null : Math.round(Number(value)))

/** scoreTrend points grouped per assessment, attempts in order. */
export function groupAttempts(scoreTrend = []) {
  const byExam = new Map()
  for (const point of scoreTrend) {
    if (point?.percentage == null) continue
    const key = point.examId ?? `title:${point.assessmentTitle}`
    if (!byExam.has(key)) {
      byExam.set(key, { examId: point.examId, title: point.assessmentTitle ?? "Assessment", type: point.assessmentType, attempts: [] })
    }
    byExam.get(key).attempts.push(point)
  }
  for (const group of byExam.values()) {
    group.attempts.sort(
      (a, b) =>
        (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0) ||
        String(a.submittedAt ?? "").localeCompare(String(b.submittedAt ?? ""))
    )
  }
  return [...byExam.values()]
}

/**
 * One row per assessment. `prefix` columns (e.g. the learner's name for a section
 * file) go first. Attempt columns run to the most attempts anyone made.
 */
export function assessmentSummary(scoreTrend, { prefixColumns = [], prefix = [], maxAttempts = null } = {}) {
  const groups = groupAttempts(scoreTrend)
  const widest = maxAttempts ?? Math.max(0, ...groups.map((g) => g.attempts.length))
  const columns = [
    ...prefixColumns,
    "Assessment", "Type", "Attempts", "First score (%)", "Best score (%)", "Latest score (%)", "Change first to latest",
    "Passed", "Passed on attempt", "First attempted on", "Last attempted on", "Best correct / items",
    ...Array.from({ length: widest }, (_, i) => `Attempt ${i + 1} (%)`),
  ]
  const rows = groups.map((g) => {
    const scores = g.attempts.map((a) => Number(a.percentage))
    const best = g.attempts.reduce((top, a) => (top == null || Number(a.percentage) > Number(top.percentage) ? a : top), null)
    const passedIndex = g.attempts.findIndex((a) => a.passed)
    const first = scores[0]
    const latest = scores[scores.length - 1]
    return [
      ...prefix,
      g.title,
      assessmentTypeLabel(g.type),
      g.attempts.length,
      round(first),
      round(Math.max(...scores)),
      round(latest),
      scores.length > 1 ? round(latest - first) : null,
      passedIndex >= 0,
      passedIndex >= 0 ? g.attempts[passedIndex].attemptNumber ?? passedIndex + 1 : null,
      g.attempts[0]?.submittedAt ?? "",
      g.attempts[g.attempts.length - 1]?.submittedAt ?? "",
      best?.correctCount != null && best?.itemCount != null ? `${best.correctCount}/${best.itemCount}` : "",
      ...Array.from({ length: widest }, (_, i) => (scores[i] == null ? null : round(scores[i]))),
    ]
  })
  return { columns, rows, groups }
}

/** Every topic the analytics ranks: mastery, priority and how much evidence. */
export function topicRows(analytics, { prefix = [] } = {}) {
  const seen = new Map()
  for (const list of [analytics?.lessonPriorities, analytics?.weakestTopics, analytics?.strongestTopics]) {
    for (const t of list ?? []) {
      if (t?.lessonId != null && !seen.has(t.lessonId)) seen.set(t.lessonId, t)
    }
  }
  return [...seen.values()]
    .sort((a, b) => Number(a.masteryPercentage ?? 0) - Number(b.masteryPercentage ?? 0))
    .map((t) => [...prefix, t.lessonTitle, t.categoryTitle ?? "", round(t.masteryPercentage), t.priorityTag ?? "", t.evidenceCount ?? 0, t.lastUpdated ?? ""])
}

export const TOPIC_COLUMNS = ["Topic", "Category", "Mastery (%)", "Priority", "Evidence (answers)", "Last updated"]

/** Category mastery tree, flattened with its level. */
export function categoryRows(rows = [], depth = 0, out = []) {
  for (const row of rows ?? []) {
    out.push([
      `${"  ".repeat(depth)}${row.title}`, row.categoryLevel ?? "", round(row.masteryPercentage), row.masteryLevel ?? "",
      row.completedLessonCount, row.totalLessonCount, row.assessedLessonCount, row.weakLessonCount, row.priorityCode ?? "",
    ])
    categoryRows(row.children, depth + 1, out)
  }
  return out
}

export const CATEGORY_COLUMNS = [
  "Category", "Level", "Mastery (%)", "Mastery level", "Lessons finished", "Lessons", "Lessons assessed", "Weak lessons", "Priority",
]

/** Every block a learner report needs, from the analytics response. */
export function learnerReportBlocks(analytics, optionsOrExtra = {}) {
  const options = Array.isArray(optionsOrExtra) ? { extraSummary: optionsOrExtra } : (optionsOrExtra ?? {})
  const {
    extraSummary = [],
    behavior = null,
    plan = null,
    student = null,
    certification = null,
  } = options

  const a = analytics ?? {}
  const summary = assessmentSummary(a.scoreTrend)
  const bucket = (title, list) => ({
    title,
    columns: ["Group", "Answered", "Correct", "Incorrect", "Accuracy (%)"],
    rows: (list ?? []).map((b) => [assessmentTypeLabel(b.bucketKey), b.totalAnswered, b.correctAnswers, b.incorrectAnswers, round(b.accuracyPercentage)]),
  })

  const studentProfileRows = [
    student?.name ? ["Learner", student.name] : null,
    student?.email ? ["Learner email", student.email] : null,
    student?.learnerId ? ["Learner ID", student.learnerId] : null,
    student?.userId ? ["User ID", student.userId] : null,
    student?.institution ? ["Institution", student.institution] : null,
    student?.department ? ["Department", student.department] : null,
    student?.section ? ["Section", student.section] : null,
  ].filter(Boolean)

  const summaryRows = [
    ...extraSummary,
    ...studentProfileRows,
    ["Certification", certification?.title ?? a.certificationTitle],
    certification?.code ? ["Certification code", certification.code] : null,
    certification?.certificationId ?? a.certificationId ? ["Certification ID", certification?.certificationId ?? a.certificationId] : null,
    ["Figures as of", a.generatedAt],
    ["Lessons finished", `${a.completedLessonCount ?? 0}/${a.totalLessonCount ?? 0}`],
    ["Curriculum completion (%)", round(a.completionPercentage)],
    ["Assessments passed", `${a.passedAssessmentCount ?? 0}/${a.totalAssessmentCount ?? 0}`],
    ["Graded attempts", a.totalAssessmentAttempts],
    ["Average assessment score (%)", round(a.averageAssessmentScore)],
    ["Correct answers", a.totalCorrectAnswers],
    ["Incorrect answers", a.totalIncorrectAnswers],
    ["Overall mastery (%)", round(a.overallMasteryPercentage)],
    ["Confidence (%)", round(a.confidencePercentage)],
    ["Readiness — chance of passing (%)", round(a.readinessPercentage)],
    ["Topics mastered", a.masteredTopicCount],
    ["Weak topics", a.weakTopicCount],
    ["Topics not yet assessed", a.unassessedTopicCount],
    a.highestPriorityTopicCount != null ? ["Highest priority topics", a.highestPriorityTopicCount] : null,
    ["Challenge attempts", a.totalChallengeAttempts],
    ["Average challenge score (%)", round(a.averageChallengeScore)],
    a.bktAvailable != null ? ["Mastery tracking active", a.bktAvailable ? "Yes" : "No"] : null,
  ].filter(Boolean)

  const blocks = [
    {
      title: "Summary",
      columns: ["Metric", "Value"],
      rows: summaryRows,
    },
  ]

  if (plan) {
    blocks.push({
      title: "Study plan & goals",
      columns: ["Metric", "Value"],
      rows: [
        ["Plan title", plan.planTitle || plan.title || "Certification Study Plan"],
        ["Target exam date", plan.targetExamDate ?? "Not set"],
        ["Daily study goal", plan.dailyGoalMinutes ? `${plan.dailyGoalMinutes} minutes/day` : "Not set"],
        ["Plan status", plan.status ?? "Active"],
      ],
    })
  }

  if (behavior) {
    blocks.push({
      title: "Study behavior & telemetry",
      columns: ["Metric", "Value"],
      rows: [
        ["Weekly study time (minutes)", behavior.weekStudyMinutes ?? 0],
        ["Focus consistency (%)", behavior.focusConsistency != null ? round(behavior.focusConsistency) : null],
        ["Reading pace", behavior.readingPace ?? "Building"],
        ["Focus checks completed", behavior.challengeCompletions ?? 0],
        ["Fast-scroll / rush events", behavior.rushEvents ?? 0],
      ],
    })
  }

  blocks.push({ title: "Assessments (one row each)", columns: summary.columns, rows: summary.rows })

  if (Array.isArray(a.scoreTrend) && a.scoreTrend.length > 0) {
    blocks.push({
      title: "Assessment attempt history (all attempts)",
      columns: ["Date & time", "Assessment", "Type", "Attempt #", "Score (%)", "Passed", "Correct", "Total items"],
      rows: a.scoreTrend
        .filter((s) => s != null)
        .sort((x, y) => String(y.submittedAt ?? "").localeCompare(String(x.submittedAt ?? "")))
        .map((s) => [
          s.submittedAt ?? "",
          s.assessmentTitle ?? "Assessment",
          assessmentTypeLabel(s.assessmentType),
          s.attemptNumber ?? 1,
          round(s.percentage),
          s.passed,
          s.correctCount != null ? s.correctCount : "",
          s.itemCount != null ? s.itemCount : "",
        ]),
    })
  }

  blocks.push(
    { title: "Topic mastery (weakest first)", columns: TOPIC_COLUMNS, rows: topicRows(a) },
    { title: "Category mastery", columns: CATEGORY_COLUMNS, rows: categoryRows(a.categoryMastery) },
    {
      title: "Recommended next topics",
      columns: ["Topic", "Why", "Suggested action", "Priority"],
      rows: (a.recommendedTopics ?? []).map((r) => [r.lessonTitle, r.reason, r.recommendedAction, r.priorityTag]),
    },
    bucket("Accuracy by assessment type", a.performanceByAssessmentType),
    bucket("Accuracy by difficulty", a.performanceByDifficulty),
    bucket("Accuracy by question type", a.performanceByQuestionType),
  )

  if (Array.isArray(a.masteryTrend) && a.masteryTrend.length > 0) {
    blocks.push({
      title: "Mastery history trend",
      columns: ["Date & time", "Topic", "Previous mastery (%)", "New mastery (%)", "Mastery level", "Trigger"],
      rows: a.masteryTrend
        .filter((m) => m != null)
        .map((m) => [
          m.occurredAt ?? "",
          m.lessonTitle ?? `Lesson #${m.lessonId}`,
          round(m.previousMastery),
          round(m.newMastery),
          m.newMasteryLevel ?? "",
          assessmentTypeLabel(m.assessmentType),
        ]),
    })
  }

  blocks.push({
    title: "Recent activity",
    columns: ["When", "Activity", "Title", "Score (%)", "Passed"],
    rows: (a.recentActivity ?? []).map((r) => [r.occurredAt, assessmentTypeLabel(r.activityType), r.title, round(r.scorePercentage), r.passed]),
  })

  return blocks
}
