import { base } from "./base"

export function getLearnerEntitlements(learnerId, certificationId) {
  const params = new URLSearchParams({ learnerId })
  if (certificationId != null) params.set("certificationId", certificationId)
  return base(`learner/entitlements?${params.toString()}`)
}

export function getLearnerSubscription(learnerId) {
  return base(`learner/subscription?learnerId=${learnerId}`)
}

export function getIndividualPlans() {
  return base("subscription-plans/individual")
}

export function initiateCheckout(planId) {
  return base(`subscription/checkout/${planId}`, { method: "POST" })
}

export function verifyLatestCheckout(sessionId) {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""
  return base(`subscription/verify-latest${query}`)
}

export function verifyCheckoutSession(sessionId) {
  return base(`subscription/verify/${encodeURIComponent(sessionId)}`)
}

export function cancelSubscription() {
  return base("subscription/cancel", { method: "POST" })
}

export function getInstitutionalPlans() {
  return base("subscription-plans/institutional")
}

export function getInstitutionLicense(institutionId) {
  return base(`institution/license?institutionId=${institutionId}`)
}

export function getInstitutionLicenseUsage(institutionId) {
  return base(`institution/license/usage?institutionId=${institutionId}`)
}

export const FEATURES = {
  DETAILED_PROGRESS: "DETAILED_PROGRESS",
  PROGRESS_ANALYTICS: "PROGRESS_ANALYTICS",
  MASTERY_ANALYTICS: "MASTERY_ANALYTICS",
  WEAKNESS_ANALYSIS: "WEAKNESS_ANALYSIS",
  PERSONALIZED_STUDY_PLAN: "PERSONALIZED_STUDY_PLAN",
  MOCK_EXAM_ACCESS: "MOCK_EXAM_ACCESS",
  BATTLES_ACCESS: "BATTLES_ACCESS",
  CHALLENGES_ACCESS: "CHALLENGES_ACCESS",
  READINESS_ANALYSIS: "READINESS_ANALYSIS",
  ADVANCED_RECOMMENDATIONS: "ADVANCED_RECOMMENDATIONS",
  QUIZ_RETAKES: "QUIZ_RETAKES",
  AI_TUTOR: "AI_TUTOR",
  COMMUNITY_FULL_ACCESS: "COMMUNITY_FULL_ACCESS",
  MISTAKE_BANK: "MISTAKE_BANK",
  WORLD_CUP_ACCESS: "WORLD_CUP_ACCESS",
}

export const FREE_ARENA_PROBLEM_LIMIT = 5

export function isPremiumError(error) {
  const code = error?.response?.data?.code
  return code === "PREMIUM_ACCESS_REQUIRED" || code === "DAILY_LIMIT_REACHED"
}

export function getAdminSubscriptions() {
  return base("admin/subscriptions")
}

export function approveSubscription(id) {
  return base(`admin/subscriptions/${id}/approve`, { method: "POST" })
}

export function rejectSubscription(id, note) {
  return base(`admin/subscriptions/${id}/reject`, { method: "POST", data: { note } })
}

export function revokeSubscription(id) {
  return base(`admin/subscriptions/${id}/revoke`, { method: "POST" })
}

export function getAdminPayments() {
  return base("admin/payments")
}

export function getAdminPlans() {
  return base("admin/pricing/plans")
}

export function getAdminPlan(id) {
  return base(`admin/pricing/plans/${id}`)
}

export function createAdminPlan(data) {
  return base("admin/pricing/plans", { method: "POST", data })
}

export function updateAdminPlan(id, data) {
  return base(`admin/pricing/plans/${id}`, { method: "PUT", data })
}

export function updatePlanEntitlements(planId, entitlements) {
  return base(`admin/pricing/plans/${planId}/entitlements`, {
    method: "PUT",
    data: { entitlements },
  })
}

export function deletePlanEntitlement(planId, code) {
  return base(`admin/pricing/plans/${planId}/entitlements/${code}`, { method: "DELETE" })
}

export function getAdminPartnershipPricing() {
  return base("admin/pricing/partnership")
}

export function updateAdminPartnershipPricing(pricePerSlot) {
  return base("admin/pricing/partnership", { method: "PUT", data: { pricePerSlot } })
}

export function getAdminRewards() {
  return base("admin/rewards")
}

export function updateAdminRewards(data) {
  return base("admin/rewards", { method: "PUT", data })
}
