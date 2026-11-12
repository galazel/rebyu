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

export function createDepartmentAnnouncement(departmentId, { title, body, pinned, certificationIds }) {
  return base(`departments/${departmentId}/announcements`, {
    method: "POST",
    data: { title, body, pinned, certificationIds },
  })
}

export function updateDepartmentAnnouncement(departmentId, announcementId, { title, body, pinned, certificationIds }) {
  return base(`departments/${departmentId}/announcements/${announcementId}`, {
    method: "PUT",
    data: { title, body, pinned, certificationIds },
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


/** The department head's dashboard: seats, totals, learner statuses, sections, alerts. */
export function getDepartmentOverview(departmentId) {
  return base(`institution/me/departments/${departmentId}/overview`)
}

/** One certification's learners: current ones, and those who left (frozen records). Owner only. */
export function getAllocationLearners(institutionCertId) {
  return base(`institution/me/certifications/${institutionCertId}/learners`)
}

/** Finished access terms (expired certifications), newest first. Owner only. */
export function getCertificationArchives() {
  return base("institution/me/certification-archives")
}

export function getCertificationArchiveLearners(archiveId) {
  return base(`institution/me/certification-archives/${archiveId}/learners`)
}

export function getGroupLearnerRoster(departmentId) {
  return base(`institution/me/departments/${departmentId}/learners`)
}

/** Tab exits, blocked copy/paste and forfeits on the learner's assessments, per attempt. */
export function getGroupLearnerIntegrity(departmentId, learnerId) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}/integrity`)
}

/** AI tutor safety alerts for one learner (self-harm, abuse, threats, data probes), newest first. */
export function getGroupLearnerSafetyAlerts(departmentId, learnerId) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}/safety-alerts`)
}

export function reviewGroupLearnerSafetyAlert(departmentId, learnerId, alertId, note) {
  return base(`institution/me/departments/${departmentId}/learners/${learnerId}/safety-alerts/${alertId}/review`, {
    method: "POST",
    data: { note: note ?? "" },
  })
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

export function createGroupSection(departmentId, { sectionName, description, institutionCertId = null, programId = null }) {
  return base(`departments/${departmentId}/sections`, {
    method: "POST",
    data: { sectionName, description, institutionCertId, programId },
  })
}

export function updateGroupSection(departmentId, sectionId, { sectionName, description, programId = null }) {
  return base(`departments/${departmentId}/sections/${sectionId}`, {
    method: "PUT",
    data: { sectionName, description, programId },
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

export function registerInstitution(code) {
  return base("onboarding/institution", { method: "POST", data: { code } })
}

export function redeemDepartmentHeadCode(code) {
  return base("onboarding/department-head/redeem", { method: "POST", data: { code } })
}

export function getDepartmentHeadCodeInvitations(departmentId) {
  return base(`onboarding/department-head/invitations?departmentId=${encodeURIComponent(departmentId)}`)
}

export function sendDepartmentHeadCode({ departmentId, email }) {
  return base("onboarding/department-head/invitations", {
    method: "POST",
    data: { departmentId, email },
  })
}

export function cancelDepartmentHeadCode(invitationId) {
  return base(`onboarding/department-head/invitations/${invitationId}/cancel`, { method: "PUT" })
}

export function getCertificationAnalytics(certificationId) {
  return base(`institution/me/certifications/${certificationId}/analytics`)
}

export function getDepartmentPrograms(departmentId) {
  return base(`departments/${departmentId}/programs`)
}

export function getDepartmentProgram(departmentId, programId) {
  return base(`departments/${departmentId}/programs/${programId}`)
}

export function createDepartmentProgram(departmentId, { programName, programCode, description, institutionCertIds }) {
  return base(`departments/${departmentId}/programs`, {
    method: "POST",
    data: { programName, programCode, description, institutionCertIds },
  })
}

/** Which certifications a program's learners can be given (department head or institution). */
export function setDepartmentProgramCertifications(departmentId, programId, institutionCertIds) {
  return base(`departments/${departmentId}/programs/${programId}/certifications`, {
    method: "PUT",
    data: { institutionCertIds },
  })
}

export function updateDepartmentProgram(departmentId, programId, { programName, programCode, description, institutionCertIds }) {
  return base(`departments/${departmentId}/programs/${programId}`, {
    method: "PUT",
    data: { programName, programCode, description, institutionCertIds },
  })
}

export function archiveDepartmentProgram(departmentId, programId) {
  return base(`departments/${departmentId}/programs/${programId}`, { method: "DELETE" })
}
