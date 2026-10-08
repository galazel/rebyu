import { base } from "./base"

export function submitPublicPartnershipRequest(payload) {
  return base("public/partnership-requests", { method: "POST", data: payload })
}

export function getPartnershipPricing() {
  return base("public/partnership-requests/pricing")
}

export function getPublicPartnershipStatus({ referenceNumber, institutionEmail }) {
  return base("public/partnership-requests/status", {
    method: "POST",
    data: { referenceNumber, institutionEmail },
  })
}

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

export function getInstitutionCertificationAccess(institutionId) {
  return base(`institution/certification-access?institutionId=${institutionId}`)
}

export function sendInstitutionInvitations({ departmentId, learners, sectionId = null }) {
  return base("institution/invitations", {
    method: "POST",
    data: { departmentId, learners, sectionId },
  })
}

export function getInstitutionInvitations(institutionId) {
  return base(`institution/invitations?institutionId=${institutionId}`)
}

export function cancelInstitutionInvitation(invitationId) {
  return base(`institution/invitations/${invitationId}/cancel`, { method: "PUT" })
}
