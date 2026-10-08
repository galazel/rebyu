
import { BookOpen, Cpu, Database, Network, Shield, Target } from "@/components/icons"
import { getCertificationModules } from "@/services/learnerService.js"

const TONES = ["macaw", "bee", "beetle", "cardinal", "feather"]
const ICONS = [Cpu, Database, Network, Shield, BookOpen, Target]

export function toneForIndex(index) {
  return TONES[index % TONES.length]
}

export function iconForIndex(index) {
  return ICONS[index % ICONS.length]
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function idOf(value) {
  return value == null ? "" : String(value)
}

export function examScope(exam) {
  const declared = String(exam?.targetScope ?? "").toUpperCase()
  if (declared) return declared

  if (exam?.lessonId != null) return "LESSON"
  if (exam?.middleCategoryId != null) return "MIDDLE_CATEGORY"
  if (exam?.majorCategoryId != null) return "MAJOR_CATEGORY"
  return "CERTIFICATION"
}

const LESSON_SCOPES = new Set(["LESSON", "LESSON_QUIZ", "QUIZ"])
const MIDDLE_SCOPES = new Set(["MIDDLE", "MIDDLE_CATEGORY", "MIDDLE_EXAM", "MODULE_EXAM"])
const MAJOR_SCOPES = new Set(["MAJOR", "MAJOR_CATEGORY", "MAJOR_EXAM"])

export function isPublishedExam(exam) {
  return String(exam?.status ?? "").toUpperCase() === "PUBLISHED"
}

export function examTypeText(exam, examTypesById) {
  return String(
    exam?.examTypeText ??
      exam?.examType?.examTypeText ??
      examTypesById?.get(idOf(exam?.examTypeId)) ??
      "",
  ).toUpperCase()
}

export function isDiagnosticExam(exam, examTypesById) {
  return (
    examTypeText(exam, examTypesById) === "DIAGNOSTIC" ||
    String(exam?.title ?? "").toLowerCase().includes("diagnostic")
  )
}

export function isMockExam(exam, examTypesById) {
  const type = examTypeText(exam, examTypesById)
  return type === "MOCK_EXAM" || String(exam?.title ?? "").toLowerCase().includes("mock exam")
}

export function buildCurriculum({
  certification,
  lessonById,
  exams = [],
  examTypesById,
  lessonPriorityById,
  examResults = [],
}) {
  const published = exams
    .filter(isPublishedExam)
    .filter((exam) => !exam.isGenerated && examScope(exam) !== "GENERATED")

  const diagnostic = published.find((exam) => isDiagnosticExam(exam, examTypesById)) ?? null
  const mockExam =
    published.find((exam) => isMockExam(exam, examTypesById)) ??
    published.find(
      (exam) =>
        examScope(exam) === "CERTIFICATION" && exam !== diagnostic && !isDiagnosticExam(exam, examTypesById),
    ) ??
    null

  const quizByLesson = new Map()
  const assessmentByMiddle = new Map()
  const assessmentByMajor = new Map()


  const extraExams = []

  published.forEach((exam) => {
    if (exam === diagnostic || exam === mockExam) return

    const scope = examScope(exam)

    if (LESSON_SCOPES.has(scope) && exam.lessonId != null) {
      if (!quizByLesson.has(idOf(exam.lessonId))) {
        quizByLesson.set(idOf(exam.lessonId), exam)
      } else {
        extraExams.push(exam)
      }
    } else if (MIDDLE_SCOPES.has(scope) && exam.middleCategoryId != null) {
      if (!assessmentByMiddle.has(idOf(exam.middleCategoryId))) {
        assessmentByMiddle.set(idOf(exam.middleCategoryId), exam)
      } else {
        extraExams.push(exam)
      }
    } else if (MAJOR_SCOPES.has(scope) && exam.majorCategoryId != null) {
      if (!assessmentByMajor.has(idOf(exam.majorCategoryId))) {
        assessmentByMajor.set(idOf(exam.majorCategoryId), exam)
      } else {
        extraExams.push(exam)
      }
    } else {
      extraExams.push(exam)
    }
  })

  const majors = getCertificationModules(certification).map((major, majorIndex) => {
    const middles = asArray(major.middleCategory).map((middle) => {
      const lessons = asArray(middle.lessons).map((lesson) => {
        const id = idOf(lesson.lessonId)
        const known = lessonById?.get(id)
        const completed = Boolean(known?.completed ?? lesson.completed)
        const quiz = quizByLesson.get(id) ?? null

        return {
          ...lesson,
          id,
          name: lesson.name ?? lesson.title ?? "Untitled lesson",
          completed,
          quiz,
          cleared: completed && (!quiz || examStanding(examResults, quiz.examId).cleared),
          priorityTag: lessonPriorityById?.get(id) ?? null,
        }
      })

      const quizzes = lessons.filter((lesson) => lesson.quiz).length
      const assessment = assessmentByMiddle.get(idOf(middle.middleCategoryId)) ?? null

      return {
        id: idOf(middle.middleCategoryId),
        name: middle.title ?? middle.name ?? "Untitled topic",
        summary: [
          `${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`,
          quizzes > 0 ? `${quizzes} quiz${quizzes === 1 ? "" : "zes"}` : null,
          assessment ? "1 assessment" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        lessons,
        quizzes,
        assessment,
        done: lessons.filter((lesson) => lesson.completed).length,
        clearedCount: lessons.filter((lesson) => lesson.cleared).length,
        cleared:
          lessons.length > 0 &&
          lessons.every((lesson) => lesson.cleared) &&
          (!assessment || examStanding(examResults, assessment.examId).cleared),
      }
    })

    const lessonCount = middles.reduce((total, middle) => total + middle.lessons.length, 0)
    const doneCount = middles.reduce((total, middle) => total + middle.done, 0)

    return {
      id: idOf(major.majorCategoryId),
      index: majorIndex + 1,
      name: major.title ?? major.name ?? `Unit ${majorIndex + 1}`,
      tone: toneForIndex(majorIndex),
      icon: iconForIndex(majorIndex),
      wordmark: `unit ${String(majorIndex + 1).padStart(2, "0")}`,
      middles,
      assessment: assessmentByMajor.get(idOf(major.majorCategoryId)) ?? null,
      lessonCount,
      doneCount,
      quizCount: middles.reduce((total, middle) => total + middle.quizzes, 0),
      assessmentCount: middles.filter((middle) => middle.assessment).length,
      progress: lessonCount ? Math.round((doneCount / lessonCount) * 100) : 0,
    }
  })

  const lessonTotal = majors.reduce((total, major) => total + major.lessonCount, 0)
  const lessonDone = majors.reduce((total, major) => total + major.doneCount, 0)

  return {
    majors,
    diagnostic,
    mockExam,
    extraExams,
    lessonTotal,
    lessonDone,
    progress: lessonTotal ? Math.round((lessonDone / lessonTotal) * 100) : 0,
  }
}

export function findMiddle(curriculum, middleId) {
  for (const major of curriculum.majors) {
    const middle = major.middles.find((item) => item.id === idOf(middleId))
    if (middle) return { major, middle }
  }
  return { major: null, middle: null }
}

export function hasSatDiagnostic({ diagnostic, examResults = [], certificationId }) {
  if (!diagnostic) {
    return true
  }

  return examResults.some((result) => {
    if (idOf(result.examId) !== idOf(diagnostic.examId)) {
      const sameCertification = idOf(result.certificationId) === idOf(certificationId)
      const looksDiagnostic = String(result.assessmentType ?? result.assessmentTitle ?? "")
        .toLowerCase()
        .includes("diagnostic")
      if (!sameCertification || !looksDiagnostic) return false
    }

    return Boolean(
      result.submittedAt ?? result.dateTaken ?? result.finishedAt ?? result.score != null,
    )
  })
}


export const PROFICIENT_RATING = 50

export function examStanding(examResults, examId) {
  const best = bestSitting(examResults, examId)
  if (!best) {
    return { taken: false, passed: false, rating: null, cleared: false, reason: "not sat yet" }
  }
  const passed = best.passed
  const rating = best.rating == null || !Number.isFinite(best.rating) ? null : best.rating

  if (rating == null) {
    return {
      taken: true,
      passed,
      rating: null,
      cleared: passed,
      reason: passed ? null : "not passed yet",
    }
  }
  if (rating < PROFICIENT_RATING) {
    return {
      taken: true,
      passed,
      rating,
      cleared: false,
      reason: `proficiency is ${Math.round(rating)} — reach ${PROFICIENT_RATING} (Proficient) to continue`,
    }
  }
  return { taken: true, passed, rating, cleared: true, reason: null }
}

export function bestSitting(examResults, examId) {
  const rows = (examResults ?? []).filter((row) => idOf(row?.examId) === idOf(examId))
  if (rows.length === 0) return null

  const rank = (row) => {
    const rating = row?.rating == null ? null : Number(row.rating)
    if (rating != null && Number.isFinite(rating)) return [2, rating]
    return [row?.isPassed === true || row?.passed === true ? 1 : 0, 0]
  }

  const winner = rows.reduce((best, row) => {
    const [aTier, aValue] = rank(row)
    const [bTier, bValue] = rank(best)
    if (aTier !== bTier) return aTier > bTier ? row : best
    if (aValue !== bValue) return aValue > bValue ? row : best
    return Number(row?.attemptNo ?? 0) > Number(best?.attemptNo ?? 0) ? row : best
  })

  const rating = winner?.rating == null ? null : Number(winner.rating)
  return {
    attemptNo: winner?.attemptNo ?? null,
    takenAt: winner?.takenAt ?? null,
    score: winner?.score == null ? null : Number(winner.score),
    rating,
    label: proficiencyLabel(rating),
    passed: winner?.isPassed === true || winner?.passed === true,
  }
}

export function proficiencyLabel(rating) {
  const value = Number(rating)
  if (!Number.isFinite(value)) return null
  if (value >= 75) return "Advanced"
  if (value >= PROFICIENT_RATING) return "Proficient"
  if (value >= 25) return "Developing"
  return "Novice"
}

export function latestSitting(examResults, examId) {
  const rows = (examResults ?? []).filter((row) => idOf(row?.examId) === idOf(examId))
  if (rows.length === 0) return null
  const newest = rows.reduce((latest, row) => {
    const a = Number(row?.attemptNo ?? 0)
    const b = Number(latest?.attemptNo ?? 0)
    if (a !== b) return a > b ? row : latest
    const at = Date.parse(row?.takenAt ?? "")
    const bt = Date.parse(latest?.takenAt ?? "")
    if (!Number.isFinite(at)) return latest
    if (!Number.isFinite(bt)) return row
    return at > bt ? row : latest
  })
  const rating = newest?.rating == null ? null : Number(newest.rating)
  return {
    attemptNo: newest?.attemptNo ?? null,
    takenAt: newest?.takenAt ?? null,
    score: newest?.score == null ? null : Number(newest.score),
    rating,
    label: proficiencyLabel(rating),
    passed: newest?.isPassed === true || newest?.passed === true,
  }
}

export function clearedExamIds(examResults) {
  const ids = new Set()
  for (const row of examResults ?? []) {
    const id = idOf(row?.examId)
    if (!id || ids.has(id)) continue
    if (examStanding(examResults, id).cleared) ids.add(id)
  }
  return ids
}
