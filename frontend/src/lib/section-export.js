import { mapLimit } from "@/components/commons/export-button.jsx"
import {
  FORMER_LEARNER_COLUMNS,
  LEARNER_COLUMNS,
  SECTION_COLUMNS,
  formerLearnerRow,
  learnerRow,
  sectionRow,
} from "@/lib/department-export.js"
import { TOPIC_COLUMNS, assessmentSummary, groupAttempts, topicRows } from "@/lib/learner-export.js"
import { getGroupLearnerAnalytics } from "@/services/institutionService.js"

/**
 * Everything about one section's students, for analysis: the section's numbers, each
 * student's row, every student's assessments (one row per student per assessment,
 * attempts across columns), and every student's topic mastery. Former students who
 * were in the section when they left are listed with their figures at departure.
 * Fetches each student's analytics at click time, four at a time.
 */
export async function sectionExportBlocks({ departmentId, section, overview }) {
  const stats = (overview?.sections ?? []).find((row) => row.sectionId === section.sectionId) ?? {}
  const students = (overview?.learners ?? []).filter((l) => l.sectionId === section.sectionId)
  const former = (overview?.formerLearners ?? []).filter((l) => l.sectionName === section.sectionName)

  const analytics = await mapLimit(students, 4, (student) => getGroupLearnerAnalytics(departmentId, student.learnerId))

  const widest = Math.max(
    0,
    ...analytics.flatMap((a) => groupAttempts(a?.scoreTrend).map((group) => group.attempts.length))
  )
  let assessmentColumns = null
  const assessmentRows = []
  const topicRowsAll = []
  students.forEach((student, index) => {
    const a = analytics[index]
    if (!a) return
    const summary = assessmentSummary(a.scoreTrend, {
      prefixColumns: ["Learner", "Username"],
      prefix: [student.name, student.username],
      maxAttempts: widest,
    })
    assessmentColumns = summary.columns
    assessmentRows.push(...summary.rows)
    topicRowsAll.push(...topicRows(a, { prefix: [student.name, student.username] }))
  })

  // Every student against every assessment the section has sat: who has not tried it yet.
  const titles = [...new Set(assessmentRows.map((row) => row[2]))]
  const coverageRows = students.map((student, index) => {
    const taken = new Set(groupAttempts(analytics[index]?.scoreTrend).map((g) => g.title))
    const passed = new Set(
      groupAttempts(analytics[index]?.scoreTrend)
        .filter((g) => g.attempts.some((attempt) => attempt.passed))
        .map((g) => g.title)
    )
    return [student.name, ...titles.map((title) => (passed.has(title) ? "Passed" : taken.has(title) ? "Not passed" : "Not taken"))]
  })

  return [
    { title: "Section", columns: SECTION_COLUMNS, rows: [sectionRow(section, stats)] },
    { title: "Students", columns: LEARNER_COLUMNS, rows: students.map(learnerRow) },
    {
      title: "Assessments per student (one row per student and assessment)",
      columns: assessmentColumns ?? ["Learner", "Username", "Assessment"],
      rows: assessmentRows,
    },
    { title: "Assessment coverage (who passed, failed or has not taken each one)", columns: ["Learner", ...titles], rows: coverageRows },
    { title: "Topic mastery per student", columns: ["Learner", "Username", ...TOPIC_COLUMNS], rows: topicRowsAll },
    { title: "Former students of this section", columns: FORMER_LEARNER_COLUMNS, rows: former.map(formerLearnerRow) },
  ]
}
