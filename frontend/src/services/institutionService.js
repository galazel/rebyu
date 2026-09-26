import { base } from "./base"

// Institution / tenant
export function getAllInstitutions() {
  return base("institutions")
}

export function getInstitutionById(institutionId) {
  return base(`institutions/${institutionId}`)
}

// Admin-only, cross-tenant: every institution's certificate allocations /
// enrolled learners. The admin institution-detail page filters these
// client-side to one institutionId.
export function getAllInstitutionCertificates() {
  return base("institution-certificates")
}

export function getAllInstitutionCertificationLearners() {
  return base("institution-certification-learners")
}

// The caller's OWN institution profile, scoped to the JWT (no admin required).
// The institution portal must use this instead of getInstitutionById, which is
// an admin-only endpoint.
export function getMyInstitutionProfile() {
  return base("institution/me/profile")
}

export function updateInstitution(institutionId, institution) {
  return base(`institutions/${institutionId}`, { method: "PUT", data: institution })
}

// Admin-only (kept for the admin org-detail view). The institution portal must
// use getMyDepartmentHeads below instead -- this one 403s for a real
// institution caller.
export function getDepartmentHeads(institutionId) {
  return base(`department-heads/institution/${institutionId}`)
}

// Every member of the caller's OWN institution, scoped to the JWT.
export function getMyDepartmentHeads() {
  return base("institution/me/members")
}

// Creates a brand-new login account for someone to manage on the org's
// behalf (e.g. a department head). Cognito emails them their credentials.
export function inviteDepartmentHead({ firstName, lastName, email, headRole }) {
  return base("institution/me/members", {
    method: "POST",
    data: { firstName, lastName, email, headRole },
  })
}

// Tenant-scoped portal snapshot: org certs, learner assignments, learner summaries,
// invitations, and invoices for the caller's own institution (derived from the JWT).
export function getInstitutionPortalOverview() {
  return base("institution/me/overview")
}

// Exam results for one of the caller's own learners (404 for learners outside the tenant).
export function getInstitutionLearnerExamResults(learnerId) {
  return base(`institution/me/learners/${learnerId}/exam-results`)
}

/* The signed-in learner's OWN pending invitations.
 *
 * This used to call "learner-invitations", which returns every invitation on
 * the platform, and the caller filtered it down to its own email in the
 * browser. That handed each learner every other learner's name, address,
 * invitation status and inviting institution -- and did it on a 30s poll. The
 * server now matches on the token's email and returns only what the caller may
 * see, so there is nothing left to filter. */
export function getMyInvitations() {
  return base("learner-invitations/me")
}

// Group-owned announcements. The backend scopes these to the caller's own
// group (owner or assigned leader); a member can only reach their groups.
export function getDepartmentAnnouncements(departmentId) {
  return base(`departments/${departmentId}/announcements`)
}

export function createDepartmentAnnouncement(departmentId, { title, body, pinned }) {
  return base(`departments/${departmentId}/announcements`, {
    method: "POST",
    data: { title, body, pinned },
  })
}

export function updateDepartmentAnnouncement(departmentId, announcementId, { title, body, pinned }) {
  return base(`departments/${departmentId}/announcements/${announcementId}`, {
    method: "PUT",
    data: { title, body, pinned },
  })
}

export function archiveDepartmentAnnouncement(departmentId, announcementId) {
  return base(`departments/${departmentId}/announcements/${announcementId}`, {
    method: "DELETE",
  })
}

// Institution learner groups (per certification allocation)
export function getDepartments({ institutionId, institutionCertId } = {}) {
  const params = new URLSearchParams()
  if (institutionId != null) params.set("institutionId", institutionId)
  if (institutionCertId != null) params.set("institutionCertId", institutionCertId)
  const query = params.toString()
  return base(`departments${query ? `?${query}` : ""}`)
}

export function getDepartmentById(departmentId) {
  return base(`departments/${departmentId}`)
}

export function createDepartment(group) {
  return base("departments", { method: "POST", data: group })
}

export function updateDepartment(departmentId, group) {
  return base(`departments/${departmentId}`, { method: "PUT", data: group })
}

export function archiveDepartment(departmentId) {
  return base(`departments/${departmentId}`, { method: "DELETE" })
}

// Group authorities (teacher / co-admin assigned by the institution to a group)
export function getDepartmentHeadAssignments({ departmentId, userId } = {}) {
  const params = new URLSearchParams()
  if (departmentId != null) params.set("departmentId", departmentId)
  if (userId != null) params.set("userId", userId)
  const query = params.toString()
  return base(`department-head-assignments${query ? `?${query}` : ""}`)
}

export function assignDepartmentHeadAssignment(authority) {
  return base("department-head-assignments", {
    method: "POST",
    data: authority,
  })
}

export function removeDepartmentHeadAssignment(authorityId) {
  return base(`department-head-assignments/${authorityId}`, {
    method: "DELETE",
  })
}

// Group assignees (learners added to a group by its assigned authority)
export function getDepartmentLearners({ departmentId } = {}) {
  const query = departmentId != null ? `?departmentId=${departmentId}` : ""
  return base(`department-learners${query}`)
}

export function addDepartmentLearner(assignee) {
  return base("department-learners", { method: "POST", data: assignee })
}

export function removeDepartmentLearner(assigneeId) {
  return base(`department-learners/${assigneeId}`, { method: "DELETE" })
}

// role: "lead" | "member" -- peer-leader distinction within the group.
export function changeDepartmentLearnerRole(assigneeId, role) {
  return base(`department-learners/${assigneeId}/role`, {
    method: "PATCH",
    data: { role },
  })
}

// Transaction Three: submit a partnership request and all of its line items
// atomically, with idempotency to prevent duplicate submissions. institutionId
// is derived server-side from the caller's JWT, not sent by the client.
export function submitPartnershipRequestTransaction(request) {
  return base("institution/partnership-requests", {
    method: "POST",
    data: request,
  })
}

export function getPartnershipRequestTransactions() {
  return base("institution/partnership-requests")
}

export function getInstitutionFiles() { return base("institution/files") }
// Returns a short-lived presigned download URL, scoped to the caller's own institution.
export function getInstitutionFileDownloadUrl(id) { return base(`institution/files/${id}/download-url`) }
export function uploadInstitutionFile(file) { const formData = new FormData(); formData.append("file", file); return base("institution/files", { method: "POST", data: formData }) }
export function deleteInstitutionFile(id) { return base(`institution/files/${id}`, { method: "DELETE" }) }

// A department head monitoring their own learners. All three are scoped to a department
// the caller actually leads (or owns) -- enforced server-side, never here.

/** The group's active learners with summary progress figures, for the table. */
export function getGroupLearnerRoster(departmentId) {
  return base(`institution/me/departments/${departmentId}/learners`)
}

/** Full statistics for one learner: weak topics, curriculum progress, readiness. */
export function getGroupLearnerAnalytics(departmentId, learnerId) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}/analytics`)
}

/** Unassigns the learner from the group. Account, enrollment and progress remain. */
export function removeLearnerFromGroup(departmentId, learnerId) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}`, { method: "DELETE" })
}

/**
 * Announcements from the groups the signed-in learner belongs to. The learner
 * is resolved from the token server-side; pass a certificationId to show only
 * the announcements belonging to that course.
 */
export function getMyAnnouncements(certificationId) {
  const query = certificationId != null ? `?certificationId=${certificationId}` : ""
  return base(`learners/me/announcements${query}`)
}

/* ---- Sections: a department head's subdivisions of one department ---- */

export function getGroupSections(departmentId) {
  return base(`departments/${departmentId}/sections`)
}

export function createGroupSection(departmentId, { sectionName, description }) {
  return base(`departments/${departmentId}/sections`, {
    method: "POST",
    data: { sectionName, description },
  })
}

export function updateGroupSection(departmentId, sectionId, { sectionName, description }) {
  return base(`departments/${departmentId}/sections/${sectionId}`, {
    method: "PUT",
    data: { sectionName, description },
  })
}

export function deleteGroupSection(departmentId, sectionId) {
  return base(`departments/${departmentId}/sections/${sectionId}`, { method: "DELETE" })
}

/** Move a learner (by assignee id) into a section; null takes them out of every section. */
export function moveLearnerToSection(departmentId, assigneeId, sectionId) {
  return base(`departments/${departmentId}/sections/assignees/${assigneeId}`, {
    method: "PATCH",
    data: { sectionId },
  })
}

/* ---- Invoices issued to the caller's institution ---- */

export function getMyInstitutionInvoices() {
  return base("institution/me/invoices")
}

export function getMyInstitutionInvoice(invoiceId) {
  return base(`institution/me/invoices/${invoiceId}`)
}

/** { checkoutUrl, sessionId } -- send the browser to checkoutUrl. */
export function startInvoiceCheckout(invoiceId) {
  return base(`institution/me/invoices/${invoiceId}/checkout`, { method: "POST" })
}

/** Ask the server to confirm the PayMongo payment; returns the (possibly now paid) invoice. */
export function verifyInvoicePayment(invoiceId) {
  return base(`institution/me/invoices/${invoiceId}/verify`, { method: "POST" })
}

/**
 * Asks REBYU to end the partnership. An admin reviews it; approving revokes
 * every learner's access immediately and refunds what was paid.
 */
export function requestPartnershipCancellation(reason) {
  return base("institution/partnership-requests/cancellation", {
    method: "POST",
    data: { reason },
  })
}
