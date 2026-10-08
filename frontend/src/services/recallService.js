import { base } from "./base"

export function createRecallSession({ certificationId, lessonId, size }) {
  return base("recall-sessions", {
    method: "POST",
    data: { certificationId, lessonId, size },
  })
}

export function createPlanMockExam({ certificationId }) {
  return base("recall-sessions", {
    method: "POST",
    data: { certificationId, mode: "mock" },
  })
}
