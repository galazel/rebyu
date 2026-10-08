import { base } from "./base.js"
import { getFileDownloadUrl, getFileViewUrl } from "./fileService.js"

export function getCurrentLearnerIdentity() {
  const read = (...keys) => {
    for (const key of keys) {
      const value = localStorage.getItem(key)
      if (value !== null && value !== undefined && value !== "") {
        return value
      }
    }
    return null
  }

  const learnerId = Number(read("learnerId", "learner_id"))
  const userId = Number(read("userId", "user_id"))

  return {
    learnerId: Number.isFinite(learnerId) ? learnerId : null,
    userId: Number.isFinite(userId) ? userId : null,
    role: read("role") ?? "",
    name: read("name", "fullName", "username") ?? "",
    email: read("email") ?? "",
  }
}

export function updateLearner(id, data) {
  return base(`learners/${id}`, {
    method: "PUT",
    data,
  })
}

export function updateUser(id, data) {
  return base(`users/${id}`, {
    method: "PUT",
    data,
  })
}

export function markLessonComplete(data) {
  return base("learner-completed-lessons", {
    method: "POST",
    data,
  })
}
export function getMyAwards() {
  return base("learners/me/awards")
}

export function getMyClasses(certificationId) {
  const query = certificationId != null ? `?certificationId=${encodeURIComponent(certificationId)}` : ""
  return base(`learners/me/classes${query}`)
}

export function getMyClassAssessments(certificationId) {
  const query = certificationId != null ? `?certificationId=${encodeURIComponent(certificationId)}` : ""
  return base(`learners/me/class-assessments${query}`)
}

export function updateMyProfile({ firstName, lastName, username, phoneNumber }) {
  return base("learners/me/profile", {
    method: "PUT",
    data: { firstName, lastName, username, phoneNumber },
  })
}

export function uploadMyAvatar(file) {
  const body = new FormData()
  body.append("file", file)
  return base("learners/me/avatar", { method: "POST", data: body })
}

export function deleteMyAvatar() {
  return base("learners/me/avatar", { method: "DELETE" })
}

export function getMyRewards() {
  return base("learner-achievements/me/rewards")
}

export function getMyAchievements() {
  return base("learner-achievements/me")
}

export function getReadSections(lessonId) {
  return base(`learners/me/read-sections?lessonId=${encodeURIComponent(lessonId)}`)
}

export function markSectionRead(lessonId, sectionKey) {
  return base("learners/me/read-sections", {
    method: "POST",
    data: { lessonId: Number(lessonId), sectionKey },
  })
}

export function markSectionUnread(lessonId, sectionKey) {
  return base(`learners/me/read-sections/${lessonId}/${encodeURIComponent(sectionKey)}`, {
    method: "DELETE",
  })
}

export function getAllExams() {
  return base("exams")
}

export function getLearnerPortalScoped(options = {}) {
  const query = options.includeProgress === false ? "?includeProgress=false" : ""
  return base(`learners/me/portal${query}`)
}

export async function getLearnerCertificationProgress() {
  try {
    return await base("learners/me/certification-progress")
  } catch (error) {


    console.warn("certification-progress failed, falling back to the portal", error)
    const portal = await getLearnerPortalScoped({ includeProgress: true })
    return asArray(portal?.certificationProgress)
  }
}

const LEARNER_PORTAL_SNAPSHOT_KEY = "rebyu:learner-portal-snapshot"

export function readLearnerPortalSnapshot() {
  try {
    const raw = sessionStorage.getItem(LEARNER_PORTAL_SNAPSHOT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeLearnerPortalSnapshot(data) {
  try {
    sessionStorage.setItem(LEARNER_PORTAL_SNAPSHOT_KEY, JSON.stringify(data))
  } catch {
  }
}

export function clearLearnerPortalSnapshot() {
  try {
    sessionStorage.removeItem(LEARNER_PORTAL_SNAPSHOT_KEY)
  } catch {
  }
}

export function getCurrentLearner() {
  return base("learners/me")
}

export function getLessonById(id) {
  return base(`lessons/${id}`)
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isPublishedCertification(certification) {
  return String(certification?.status ?? "").toUpperCase() === "PUBLISHED"
}

function getCertificationLessons(certification) {
  return asArray(certification?.majorCategory).flatMap((major) =>
    asArray(major.middleCategory).flatMap((middle) =>
      asArray(middle.lessons).map((lesson) => ({
        ...lesson,
        certificationId: certification.certificationId,
        certificationTitle: certification.title,
        majorCategoryId: major.majorCategoryId,
        majorCategoryTitle: major.title,
        middleCategoryId: middle.middleCategoryId,
        middleCategoryTitle: middle.title,
      }))
    )
  )
}

export function flattenCertificationLessons(certifications = []) {
  return certifications.flatMap(getCertificationLessons)
}

export function getCertificationModules(certification) {
  return asArray(certification?.majorCategory).map((major) => ({
    ...major,
    middleCategory: asArray(major.middleCategory).map((middle) => ({
      ...middle,
      lessons: asArray(middle.lessons).map((lesson) => ({
        ...lesson,
        certificationId: certification.certificationId,
        certificationTitle: certification.title,
        majorCategoryId: major.majorCategoryId,
        majorCategoryTitle: major.title,
        middleCategoryId: middle.middleCategoryId,
        middleCategoryTitle: middle.title,
      })),
    })),
  }))
}

function isSameId(a, b) {
  return String(a ?? "") === String(b ?? "")
}

function completionKey(item) {
  return `${item.learnerId}:${item.lessonId}`
}

function getScoreNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export async function getLearnerPortalData() {
  const identity = getCurrentLearnerIdentity()

  const [portal, certifications, exams] = await Promise.all([


    getLearnerPortalScoped({ includeProgress: false }),
    base("certifications"),
    getAllExams(),
  ])

  const learnerCertifications = asArray(portal.learnerCertifications)
  const completedLessons = asArray(portal.completedLessons)
  const examResults = asArray(portal.examResults)
  const institutionCertLearners = asArray(portal.institutionCertLearners)
  const institutionCertificates = asArray(portal.institutionCertificates)

  const learner = portal.learner ?? null
  const learnerId = learner?.learnerId ?? null
  const userId = learner?.userId ?? identity.userId
  const user = portal.user ?? null

  const purchaseEnrollments = asArray(learnerCertifications).filter(
    (item) =>
      isSameId(item.learnerId, learnerId) &&
      String(item.status ?? "active").toLowerCase() === "active"
  )

  const institutionCertIdToCertificationId = new Map(
    asArray(institutionCertificates).map((institutionCert) => [
      String(institutionCert.institutionCertId),
      institutionCert.certificationId,
    ])
  )
  const institutionEnrollments = asArray(institutionCertLearners)
    .filter(
      (item) =>
        isSameId(item.learnerId, learnerId) && item.status === "active"
    )
    .map((item) => ({
      certificationId: institutionCertIdToCertificationId.get(String(item.institutionCertId)),
      learnerId,
      status: "active",
      source: "institution",
      assignedAt: item.assignedAt,
    }))
    .filter((item) => item.certificationId != null)

  const enrollments = [...purchaseEnrollments, ...institutionEnrollments]

  const enrolledCertificationIds = new Set(
    enrollments.map((item) => String(item.certificationId))
  )

  const publishedCertifications = asArray(certifications).filter(
    isPublishedCertification
  )

  const enrolledCertifications = publishedCertifications.filter((certification) =>
    enrolledCertificationIds.has(String(certification.certificationId))
  )

  const lessonList = flattenCertificationLessons(publishedCertifications)
  const allLessons = lessonList

  const completedForLearner = asArray(completedLessons).filter((item) =>
    isSameId(item.learnerId, learnerId)
  )
  const completedSet = new Set(completedForLearner.map(completionKey))

  const examById = new Map(asArray(exams).map((exam) => [String(exam.examId), exam]))
  const examResultsForLearner = asArray(examResults)
    .filter((item) => isSameId(item.learnerId, learnerId))
    .map((result) => {
      const exam = examById.get(String(result.examId))
      return {
        ...result,
        certificationId:
          result.certificationId ?? exam?.certificationId ?? exam?.certification?.certificationId,
        assessmentType:
          result.assessmentType ?? exam?.examTypeText ?? exam?.examType?.examTypeText,
        assessmentTitle: result.assessmentTitle ?? exam?.title,
      }
    })

  const lessonsWithProgress = lessonList.map((lesson) => {
    const complete = completedSet.has(`${learnerId}:${lesson.lessonId}`)

    return {
      ...lesson,
      completed: complete,
      status: complete ? "Completed" : "Not Started",
    }
  })

  const completedCount = lessonsWithProgress.filter((lesson) => lesson.completed).length
  const totalLessons = lessonsWithProgress.length
  const overallProgress =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : null

  const performancePoints = examResultsForLearner
    .map((result) => {
      const exam = examById.get(String(result.examId))
      return {
        id: `${result.examId}-${result.attemptNo}`,
        label: result.takenAt
          ? new Date(result.takenAt).toLocaleDateString()
          : `Attempt ${result.attemptNo}`,
        score: getScoreNumber(result.score),
        kind: exam?.title?.toLowerCase().includes("quiz") ? "Quiz" : "Exam",
        title: exam?.title ?? `Exam ${result.examId}`,
        takenAt: result.takenAt,
      }
    })
    .filter((point) => point.score !== null)
    .sort((a, b) => new Date(a.takenAt ?? 0) - new Date(b.takenAt ?? 0))

  const recentExamResults = performancePoints.slice(-5).reverse()

  const resources = []

  for (const lesson of allLessons) {
    const parsed = parseLessonStructure(lesson.lessonComponentStructure)
    for (const section of parsed) {
      for (const tool of asArray(section.content)) {
        const key = tool?.data?.imageKey ?? tool?.data?.videoKey
        if (key) {
          resources.push({
            id: `${lesson.lessonId}-${tool.id}`,
            name: tool?.data?.title || tool?.type || key.split("/").pop(),
            key,
            type: tool?.data?.videoKey ? "Video" : "Image",
            certificationId: lesson.certificationId,
            certificationTitle: lesson.certificationTitle,
            lessonId: lesson.lessonId,
            lessonTitle: lesson.name,
            viewUrl: getFileViewUrl(key),
            downloadUrl: getFileDownloadUrl(key),
          })
        }
      }
    }
  }

  return {
    identity,
    learnerId,
    userId,
    learner,
    user,
    certifications: publishedCertifications,
    enrollments,
    enrolledCertifications,
    lessons: lessonsWithProgress,
    completedLessons: completedForLearner,
    exams: asArray(exams),
    examResults: examResultsForLearner,
    performancePoints,
    recentExamResults,
    resources,
    achievements: asArray(portal.achievements),
    certificationProgress: asArray(portal.certificationProgress),
    totalXp: Number(portal.totalXp) || 0,
    coinBalance: Number(portal.coinBalance) || 0,
    aiCreditsRemaining: Number(portal.aiCreditsRemaining) || 0,
    stats: {
      totalLessons,
      completedCount,
      overallProgress,
    },
  }
}

export function parseLessonStructure(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
