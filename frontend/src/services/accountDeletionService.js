import { base } from "./base"

// The signed-in user's own request. 204 (no request yet) comes back as an empty body.
export async function getMyDeletionRequest() {
  const data = await base("auth/me/deletion-request")
  return data && typeof data === "object" ? data : null
}

export function submitDeletionRequest(reason) {
  return base("auth/me/deletion-request", { method: "POST", data: { reason } })
}

export function cancelDeletionRequest() {
  return base("auth/me/deletion-request", { method: "DELETE" })
}

// Admin review.
export function listDeletionRequests(pendingOnly) {
  return base(`admin/account-deletion-requests?pendingOnly=${pendingOnly}`)
}

export function approveDeletionRequest(requestId, note) {
  return base(`admin/account-deletion-requests/${requestId}/approve`, { method: "POST", data: { note } })
}

export function declineDeletionRequest(requestId, note) {
  return base(`admin/account-deletion-requests/${requestId}/decline`, { method: "POST", data: { note } })
}
