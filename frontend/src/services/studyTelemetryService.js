import { base } from "./base"

export function recordStudyTelemetry(payload) {
  return base("learners/me/study-behavior", { method: "POST", data: payload })
}

export function getStudyBehavior(certificationId) {
  return base(`learners/me/study-behavior?certificationId=${certificationId}`)
}
