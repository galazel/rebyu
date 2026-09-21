import { base } from "./base"

// B2C entitlements + plans. The backend is the source of truth; the frontend
// never derives premium access from localStorage.
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

// Checkout lifecycle: initiate -> PayMongo hosted checkout -> redirect back
// to /subscription/success or /subscription/cancel -> verify.
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

// Institution (B2B) license reads
export function getInstitutionLicense(institutionId) {
  return base(`institution/license?institutionId=${institutionId}`)
}

export function getInstitutionLicenseUsage(institutionId) {
  return base(`institution/license/usage?institutionId=${institutionId}`)
}

// Well-known premium feature codes (must match backend Entitlements)
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

/** Problems a Free learner may sit in CodeStrike and Blueprint Arena (matches the backend). */
export const FREE_ARENA_PROBLEM_LIMIT = 5

/** True when an API error is the backend saying "this is Pro". */
export function isPremiumError(error) {
  const code = error?.response?.data?.code
  return code === "PREMIUM_ACCESS_REQUIRED" || code === "DAILY_LIMIT_REACHED"
}

// Admin review queue for Pro (PayMongo runs in test mode, so an admin approves each one).
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

/**
 * Everyone who has paid, from both tables: completed certification orders
 * (LEARNER_ORDERS) and paid Pro subscriptions (LEARNER_SUBSCRIPTIONS).
 * Shape: { payers, certificationOrders, proPayments, certificationRevenue, proRevenue, payments[] }.
 */
export function getAdminPayments() {
  return base("admin/payments")
}
