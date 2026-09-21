import { base } from "./base"

// Transaction One (public): submit a partnership request from the landing page
// and check its status. No authentication required.
export function submitPublicPartnershipRequest(payload) {
  return base("public/partnership-requests", { method: "POST", data: payload })
}

/** { pricePerSlot, currency } -- the flat per-slot rate the invoice will use. */
export function getPartnershipPricing() {
  return base("public/partnership-requests/pricing")
}

export function getPublicPartnershipStatus({ referenceNumber, institutionEmail }) {
  return base("public/partnership-requests/status", {
    method: "POST",
    data: { referenceNumber, institutionEmail },
  })
}

// Transaction Two (admin): review partnership requests.
export function getAdminPartnershipRequests(status) {
  const query = status && status !== "ALL" ? `?status=${status}` : ""
  return base(`admin/partnership-requests${query}`)
}

export function getAdminPartnershipRequestDetail(requestId) {
  return base(`admin/partnership-requests/${requestId}`)
}

export function approvePartnershipRequest(requestId, remarks) {
  return base(`admin/partnership-requests/${requestId}/approve`, {
    method: "PUT",
    data: { remarks },
  })
}

export function rejectPartnershipRequest(requestId, remarks) {
  return base(`admin/partnership-requests/${requestId}/reject`, {
    method: "PUT",
    data: { remarks },
  })
}

// Transaction Three (institution): certification access + learner invitations.
export function getInstitutionCertificationAccess(institutionId) {
  return base(`institution/certification-access?institutionId=${institutionId}`)
}

// Sent by a group's leader only -- departmentId is required; the
// certification/slots are derived server-side from the group. `learners` is a
// list of { firstName, lastName, email } (name optional, email required).
// sectionId is optional: when given, accepted learners land in that section.
export function sendInstitutionInvitations({ departmentId, learners, sectionId = null }) {
  return base("institution/invitations", {
    method: "POST",
    data: { departmentId, learners, sectionId },
  })
}

export function getInstitutionInvitations(institutionId) {
  return base(`institution/invitations?institutionId=${institutionId}`)
}

// Only the invitation's own group leader may cancel it; institutionId is
// resolved from the caller's JWT server-side, never a client param.
export function cancelInstitutionInvitation(invitationId) {
  return base(`institution/invitations/${invitationId}/cancel`, { method: "PUT" })
}
