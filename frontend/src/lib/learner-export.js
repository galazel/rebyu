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

const NOT_YET = "Not yet"
const orNotYet = (value) => (value == null || value === "" || Number.isNaN(value) ? NOT_YET : value)
const mean = (values) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null)
const median = (values) => {
  if (!values.length) return null
  const sorted = [...values].sort((x, y) => x - y)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "")

/**
 * Score statistics across every graded attempt: averages (all, first, best, latest), median,
 * highest and lowest with where and when, pass rate, retakes and improvement, recent form.
 */
export function scoreStatistics(scoreTrend = []) {
  const groups = groupAttempts(scoreTrend)
  const attempts = groups.flatMap((g) => g.attempts.map((a) => ({ ...a, title: g.title, score: Number(a.percentage) })))
  if (!attempts.length) return { rows: [], byType: [] }

  const scores = attempts.map((a) => a.score)
  const highest = attempts.reduce((top, a) => (a.score > top.score ? a : top))
  const lowest = attempts.reduce((low, a) => (a.score < low.score ? a : low))
  const firsts = groups.map((g) => Number(g.attempts[0].percentage))
  const bests = groups.map((g) => Math.max(...g.attempts.map((a) => Number(a.percentage))))
  const latests = groups.map((g) => Number(g.attempts[g.attempts.length - 1].percentage))
  const passedGroups = groups.filter((g) => g.attempts.some((a) => a.passed))
  const attemptsToPass = passedGroups.map((g) => g.attempts.findIndex((a) => a.passed) + 1)
  const retaken = groups.filter((g) => g.attempts.length > 1)
  const gains = retaken.map((g) => ({
    title: g.title,
    gain: Math.max(...g.attempts.map((a) => Number(a.percentage))) - Number(g.attempts[0].percentage),
  }))
  const mostImproved = gains.reduce((top, g) => (top == null || g.gain > top.gain ? g : top), null)
  const chronological = [...attempts].sort((x, y) => String(x.submittedAt ?? "").localeCompare(String(y.submittedAt ?? "")))
  const window = Math.min(5, Math.floor(chronological.length / 2))

  const rows = [
    ["Assessments attempted", groups.length],
    ["Graded attempts", attempts.length],
    ["Average score, all attempts (%)", round(mean(scores))],
    ["Average first-attempt score (%)", round(mean(firsts))],
    ["Average best score per assessment (%)", round(mean(bests))],
    ["Average latest score (%)", round(mean(latests))],
    ["Median score (%)", round(median(scores))],
    ["Highest score (%)", round(highest.score)],
    ["Highest score: assessment", highest.title],
    ["Highest score: date", dateOnly(highest.submittedAt)],
    ["Lowest score (%)", round(lowest.score)],
    ["Lowest score: assessment", lowest.title],
    ["Lowest score: date", dateOnly(lowest.submittedAt)],
    ["Passing attempts (%)", round((attempts.filter((a) => a.passed).length / attempts.length) * 100)],
    ["Assessments passed (of those attempted)", `${passedGroups.length}/${groups.length}`],
    ["Passed on the first try", passedGroups.filter((g) => g.attempts[0].passed).length],
    ["Average attempts needed to pass", orNotYet(attemptsToPass.length ? Math.round(mean(attemptsToPass) * 10) / 10 : null)],
    ["Assessments retaken", retaken.length],
    ["Average gain from first to best try (points)", orNotYet(gains.length ? round(mean(gains.map((g) => g.gain))) : null)],
    ["Most improved assessment", mostImproved && mostImproved.gain > 0 ? `${mostImproved.title} (+${round(mostImproved.gain)})` : NOT_YET],
    ...(window >= 2
      ? [
          [`Average of your first ${window} attempts (%)`, round(mean(chronological.slice(0, window).map((a) => a.score)))],
          [`Average of your latest ${window} attempts (%)`, round(mean(chronological.slice(-window).map((a) => a.score)))],
        ]
      : []),
  ]

  const byTypeMap = new Map()
  for (const g of groups) {
    const key = g.type ?? "OTHER"
    if (!byTypeMap.has(key)) byTypeMap.set(key, { assessments: 0, attempts: [], passed: 0 })
    const entry = byTypeMap.get(key)
    entry.assessments += 1
    entry.attempts.push(...g.attempts.map((a) => Number(a.percentage)))
    if (g.attempts.some((a) => a.passed)) entry.passed += 1
  }
  const byType = [...byTypeMap.entries()].map(([type, e]) => [
    assessmentTypeLabel(type), e.assessments, e.attempts.length, round(mean(e.attempts)),
    round(Math.max(...e.attempts)), round(Math.min(...e.attempts)), `${e.passed}/${e.assessments}`,
  ])
  return { rows, byType }
}

/** A section with nothing in it yet says so in one line, instead of a bare header. */
function orEmpty(rows, message) {
  return rows && rows.length ? rows : [[message]]
}

/**
 * Every block a learner report needs, from the analytics response.
 * Supports `(analytics, extraSummary, extras)` and `(analytics, optionsObject)`.
 */
export function learnerReportBlocks(analytics, extraSummaryOrOptions = [], extras = {}) {
  const isArrayArg = Array.isArray(extraSummaryOrOptions)
  const extraSummary = isArrayArg ? extraSummaryOrOptions : (extraSummaryOrOptions?.extraSummary ?? [])
  const mergedExtras = isArrayArg ? (extras ?? {}) : (extraSummaryOrOptions ?? {})
  const {
    behavior = null,
    plan = null,
    student = null,
    certification = null,
  } = mergedExtras
  const a = analytics ?? {}
  const summary = assessmentSummary(a.scoreTrend)
  const stats = scoreStatistics(a.scoreTrend)
  const bucket = (title, list, empty) => ({
    title,
    columns: ["Group", "Answered", "Correct", "Incorrect", "Accuracy (%)"],
    rows: orEmpty(
      (list ?? []).map((b) => [assessmentTypeLabel(b.bucketKey), b.totalAnswered, b.correctAnswers, b.incorrectAnswers, round(b.accuracyPercentage)]),
      empty,
    ),
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
    ["Curriculum completion (%)", round(a.completionPercentage) ?? 0],
    ["Assessments passed (of all in this certification)", `${a.passedAssessmentCount ?? 0}/${a.totalAssessmentCount ?? 0}`],
    ["Graded attempts", a.totalAssessmentAttempts ?? 0],
    ["Average assessment score (%)", orNotYet(round(a.averageAssessmentScore))],
    ["Highest score (%)", orNotYet(stats.rows.find((r) => r[0] === "Highest score (%)")?.[1])],
    ["Lowest score (%)", orNotYet(stats.rows.find((r) => r[0] === "Lowest score (%)")?.[1])],
    ["Correct answers", a.totalCorrectAnswers ?? 0],
    ["Incorrect answers", a.totalIncorrectAnswers ?? 0],
    ["Answer accuracy (%)", orNotYet(
      (a.totalCorrectAnswers ?? 0) + (a.totalIncorrectAnswers ?? 0) > 0
        ? round((a.totalCorrectAnswers / (a.totalCorrectAnswers + a.totalIncorrectAnswers)) * 100)
        : null,
    )],
    ["Overall mastery (%)", orNotYet(round(a.overallMasteryPercentage))],
    ["Confidence (%)", orNotYet(a.totalAssessmentAttempts ? round(a.confidencePercentage) : null)],
    ["Readiness: chance of passing (%)", orNotYet(a.totalAssessmentAttempts ? round(a.readinessPercentage) : null)],
    ["Topics mastered", a.masteredTopicCount ?? 0],
    ["Weak topics", a.weakTopicCount ?? 0],
    ["Topics not yet assessed", a.unassessedTopicCount ?? 0],
    a.highestPriorityTopicCount != null ? ["Highest priority topics", a.highestPriorityTopicCount] : null,
    ["Challenge attempts", a.totalChallengeAttempts ?? 0],
    ["Average challenge score (%)", orNotYet(round(a.averageChallengeScore))],
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

  blocks.push(
    {
      title: "Score statistics",
      columns: ["Metric", "Value"],
      rows: orEmpty(stats.rows, "No assessments taken yet. Scores appear here after your first quiz or exam."),
    },
    {
      title: "Scores by assessment type",
      columns: ["Type", "Assessments", "Attempts", "Average (%)", "Highest (%)", "Lowest (%)", "Passed"],
      rows: orEmpty(stats.byType, "No assessments taken yet."),
    },
    { title: "Assessments (one row each)", columns: summary.columns, rows: orEmpty(summary.rows, "No assessments taken yet.") },
  )

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

  if (behavior) {
    blocks.push({
      title: "Study habits (last 7 days)",
      columns: ["Metric", "Value"],
      rows: [
        ["Minutes studied this week", behavior.weekStudyMinutes ?? 0],
        ["Minutes studied today", behavior.todayStudyMinutes ?? 0],
        ["Focus consistency (%)", behavior.focusConsistency ?? 100],
        ["Reading pace", behavior.readingPace ?? NOT_YET],
        ["Focus checks completed", behavior.challengeCompletions ?? 0],
        ["Sections skimmed too fast", behavior.rushEvents ?? 0],
      ],
    })
    blocks.push({
      title: "Study time by day",
      columns: ["Date", "Minutes studied", "Sections skimmed too fast"],
      rows: orEmpty((behavior.trend ?? []).map((d) => [d.date, d.studyMinutes ?? 0, d.rushes ?? 0]), "No study sessions recorded this week."),
    })
  }

  blocks.push(
    { title: "Topic mastery (weakest first)", columns: TOPIC_COLUMNS, rows: orEmpty(topicRows(a), "No topic has enough answers to score yet.") },
    { title: "Category mastery", columns: CATEGORY_COLUMNS, rows: orEmpty(categoryRows(a.categoryMastery), "No categories yet.") },
    {
      title: "Recommended next topics",
      columns: ["Topic", "Why", "Suggested action", "Priority"],
      rows: orEmpty(
        (a.recommendedTopics ?? []).map((r) => [r.lessonTitle, r.reason, r.recommendedAction, r.priorityTag]),
        "Recommendations appear once you have answered some questions.",
      ),
    },
    bucket("Accuracy by assessment type", a.performanceByAssessmentType, "No answers yet."),
    bucket("Accuracy by difficulty", a.performanceByDifficulty, "No answers yet."),
    bucket("Accuracy by question type", a.performanceByQuestionType, "No answers yet."),
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
    rows: orEmpty(
      (a.recentActivity ?? []).map((r) => [r.occurredAt, assessmentTypeLabel(r.activityType), r.title, round(r.scorePercentage), r.passed]),
      "No activity yet.",
    ),
  })

  return blocks
}
