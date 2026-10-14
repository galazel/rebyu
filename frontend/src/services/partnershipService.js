import { base } from "./base"

export function submitPublicPartnershipRequest(payload) {
  return base("public/partnership-requests", { method: "POST", data: payload })
}

export function getPartnershipPricing() {
  return base("public/partnership-requests/pricing")
}

export function getRegistrationRequest(referenceNumber) {
  return base("public/partnership-requests/registration", {
    method: "POST",
    data: { referenceNumber },
  })
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

export function sendInstitutionInvitations({ departmentId, learners, sectionId = null, institutionCertId = null }) {
  return base("institution/invitations", {
    method: "POST",
    data: { departmentId, learners, sectionId, institutionCertId },
  })
}

export function getInstitutionInvitations(institutionId) {
  const query = institutionId != null ? `?institutionId=${institutionId}` : ""
  return base(`institution/invitations${query}`)
}

export function cancelInstitutionInvitation(invitationId) {
  return base(`institution/invitations/${invitationId}/cancel`, { method: "PUT" })
}

export function lookupDepartmentHeadCode(code) {
  return base("public/department-head-codes/lookup", { method: "POST", data: { code } })
}
