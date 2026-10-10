import { base } from "./base"

export function getAllInstitutions() {
  return base("institutions")
}

export function getInstitutionById(institutionId) {
  return base(`institutions/${institutionId}`)
}

export function getAllInstitutionCertificates() {
  return base("institution-certificates")
}

export function getAllInstitutionCertificationLearners() {
  return base("institution-certification-learners")
}

export function getMyInstitutionProfile() {
  return base("institution/me/profile")
}

export function updateInstitution(institutionId, institution) {
  return base(`institutions/${institutionId}`, { method: "PUT", data: institution })
}

export function getDepartmentHeads(institutionId) {
  return base(`department-heads/institution/${institutionId}`)
}

export function getMyDepartmentHeads() {
  return base("institution/me/members")
}

export function inviteDepartmentHead({ firstName, lastName, email, headRole }) {
  return base("institution/me/members", {
    method: "POST",
    data: { firstName, lastName, email, headRole },
  })
}

export function getInstitutionPortalOverview() {
  return base("institution/me/overview")
}

export function getInstitutionLearnerExamResults(learnerId) {
  return base(`institution/me/learners/${learnerId}/exam-results`)
}

export function getMyInvitations() {
  return base("learner-invitations/me")
}

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

export function changeDepartmentLearnerRole(assigneeId, role) {
  return base(`department-learners/${assigneeId}/role`, {
    method: "PATCH",
    data: { role },
  })
}

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
export function getInstitutionFileDownloadUrl(id) { return base(`institution/files/${id}/download-url`) }
export function uploadInstitutionFile(file) { const formData = new FormData(); formData.append("file", file); return base("institution/files", { method: "POST", data: formData }) }
export function deleteInstitutionFile(id) { return base(`institution/files/${id}`, { method: "DELETE" }) }


export function getGroupLearnerRoster(departmentId) {
  return base(`institution/me/departments/${departmentId}/learners`)
}

export function getGroupLearnerAnalytics(departmentId, learnerId) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}/analytics`)
}

export function getDepartmentAssessmentResults(departmentId, examId) {
  return base(`institution/me/departments/${departmentId}/assessments/${examId}/results`)
}

export function getMemberAttemptResult(departmentId, learnerId, attemptId) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}/attempts/${attemptId}/result`)
}

export function getGroupLearnerAwards(learnerId) {
  return base(`institution/me/learners/${learnerId}/awards`)
}

export function removeLearnerFromGroup(departmentId, learnerId) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}`, { method: "DELETE" })
}

export function getMyAnnouncements(certificationId) {
  const query = certificationId != null ? `?certificationId=${certificationId}` : ""
  return base(`learners/me/announcements${query}`)
}


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

export function moveLearnerToSection(departmentId, assigneeId, sectionId) {
  return base(`departments/${departmentId}/sections/assignees/${assigneeId}`, {
    method: "PATCH",
    data: { sectionId },
  })
}


export function getMyInstitutionInvoices() {
  return base("institution/me/invoices")
}

export function getMyInstitutionInvoice(invoiceId) {
  return base(`institution/me/invoices/${invoiceId}`)
}

export function startInvoiceCheckout(invoiceId) {
  return base(`institution/me/invoices/${invoiceId}/checkout`, { method: "POST" })
}

export function verifyInvoicePayment(invoiceId) {
  return base(`institution/me/invoices/${invoiceId}/verify`, { method: "POST" })
}

export function requestPartnershipCancellation(reason) {
  return base("institution/partnership-requests/cancellation", {
    method: "POST",
    data: { reason },
  })
}
