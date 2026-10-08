import { base } from "./base.js"


export function getKnowledgeCheckOffer(lessonId, { currentLessonOnly = false } = {}) {
  return base(
    `learners/me/knowledge-checks/offer?lessonId=${lessonId}&currentLessonOnly=${currentLessonOnly}`,
  )
}

export function createKnowledgeCheck(lessonId, { currentLessonOnly = false } = {}) {
  return base("learners/me/knowledge-checks", {
    method: "POST",
    data: { lessonId: Number(lessonId), currentLessonOnly },
  })
}

export function getKnowledgeCheckKey(examId) {
  return base(`learners/me/knowledge-checks/${examId}/key`)
}
