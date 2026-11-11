import { base } from "./base"


export function getActiveStudyPlan(certificationId) {
  return base(
    certificationId
      ? `study-plans/me/active?certificationId=${certificationId}`
      : "study-plans/me/active"
  )
}

export function getOverallStudyPlan() {
  return base("study-plans/me/active?scope=overall")
}

export function getMyStudyPlans() {
  return base("study-plans/my-plans")
}

export function saveStudyPlan({ certificationId, goal, schedule }) {
  return base("study-plans", {
    method: "POST",
    data: { certificationId, goal, schedule },
  })
}

/** Removes every active study plan (overall and per-certification) and its task progress. */
export function clearStudyPlans() {
  return base("study-plans/me/active", { method: "DELETE" })
}

export function getStudyPlanTaskStatuses() {
  return base("study-plans/me/tasks")
}

export function setStudyPlanTaskStatus({ planId, eventId, status }) {
  return base(`study-plans/${planId}/tasks/${encodeURIComponent(eventId)}/status`, {
    method: "PUT",
    data: { status },
  })
}

export const STUDY_PLAN_QUERY_KEY = "learner-study-plan"

export const STUDY_PLAN_TASKS_QUERY_KEY = "learner-study-plan-tasks"
