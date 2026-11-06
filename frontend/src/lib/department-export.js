import { LEARNER_STATUS } from "@/hooks/use-my-department.js"
import { assessmentSummary, topicRows } from "@/lib/learner-export.js"

export { assessmentSummary, topicRows }

/* The learner and section columns every department export uses, so the dashboard,
   roster, section and program files line up column for column. Rows take the
   overview endpoint's learner, former-learner and section rows. Every row carries
   its dates. */

const round = (value) => (value == null || value === "" ? null : Math.round(Number(value)))

export const LEARNER_COLUMNS = [
  "Learner", "Username", "Section", "Program", "Certification", "Status", "Reason",
  "Completion (%)", "Average score (%)", "Pass rate (%)", "Graded attempts", "Lessons finished",
  "Joined on", "Last active", "Days inactive", "Passed mock exam", "Mock exam passed on",
]

export function learnerRow(l) {
  return [
    l.name, l.username, l.sectionName ?? "No section", l.programName ?? "", l.certificationTitle,
    LEARNER_STATUS[l.status]?.label ?? l.status, l.reason ?? "",
    round(l.averageProgress), l.averageScore, l.passRate, l.gradedAttempts, l.lessonsCompleted,
    l.joinedAt ?? "", l.lastActivityAt ?? "Never", l.daysInactive, Boolean(l.mockExamPassed), l.mockExamPassedAt ?? "",
  ]
}

export const FORMER_LEARNER_COLUMNS = [
  "Learner", "Username", "Section (when removed)", "Program", "Certification", "Joined on", "Removed on",
  "Completion (%)", "Average score (%)", "Pass rate (%)", "Graded attempts", "Lessons finished",
  "Last active before removal",
]

export function formerLearnerRow(l) {
  return [
    l.name, l.username, l.sectionName ?? "No section", l.programName ?? "", l.certificationTitle,
    l.joinedAt ?? "", l.removedAt ?? "", round(l.averageProgress), l.averageScore, l.passRate,
    l.gradedAttempts, l.lessonsCompleted, l.lastActivityAt ?? "Never",
  ]
}

export const SECTION_COLUMNS = [
  "Section", "Program", "Certification", "Learners", "Completion (%)", "Average score (%)",
  "At risk", "Gone quiet", "Not started", "Pending invitations", "Created on",
]

/** `section` from the sections list, `stats` from the overview's section rows (either may be partial). */
export function sectionRow(section = {}, stats = {}) {
  return [
    section.sectionName ?? stats.sectionName,
    section.programName ?? stats.programName ?? "No program",
    section.certificationTitle ?? stats.certificationTitle,
    section.learnerCount ?? stats.learners ?? 0,
    round(stats.averageProgress),
    stats.averageScore, stats.atRisk ?? 0, stats.dormant ?? 0, stats.notStarted ?? 0,
    section.pendingInvitationCount ?? stats.pendingInvitations ?? 0,
    section.createdAt ?? stats.createdAt ?? "",
  ]
}

export const PROGRAM_COLUMNS = [
  "Code", "Program", "Certifications", "Sections", "Learners", "Completion (%)", "Need a check-in", "Created on",
]

export const ANNOUNCEMENT_COLUMNS = ["Title", "Pinned", "Posted by", "Posted on", "Updated on", "Body"]

export function announcementRow(a) {
  return [a.title, Boolean(a.pinned), a.createdByEmail ?? "", a.createdAt, a.updatedAt ?? "", a.body]
}
