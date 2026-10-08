export function certificationProgressPercent({
  completedLessons = 0,
  totalLessons = 0,
  passedAssessments = 0,
  totalAssessments = 0,
} = {}) {
  const lessonUnits = Math.max(0, totalLessons)
  const assessmentUnits = Math.max(0, totalAssessments)
  const totalUnits = lessonUnits + assessmentUnits

  if (totalUnits === 0) return 0

  const doneUnits =
    Math.min(Math.max(0, completedLessons), lessonUnits) +
    Math.min(Math.max(0, passedAssessments), assessmentUnits)

  return Math.round((doneUnits / totalUnits) * 100)
}

export function findCertificationProgress(rows, certificationId) {
  if (!Array.isArray(rows) || certificationId == null) return null
  return (
    rows.find((row) => String(row.certificationId) === String(certificationId)) ?? null
  )
}
