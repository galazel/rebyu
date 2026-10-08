import { base } from "./base"


export const STUDY_DESK_NOTES_KEY = "learner-study-notes"
export const DASHBOARD_LAYOUT_KEY = "learner-dashboard-layout"

export function getDashboardLayout() {
  return base("study-desk/dashboard-layout")
}

export function saveDashboardLayout(tiles) {
  return base("study-desk/dashboard-layout", { method: "PUT", data: { tiles } })
}

export function getNotes(certificationId) {
  return base(`study-desk/notes?certificationId=${certificationId}`)
}

export function addNote(certificationId, body) {
  return base(`study-desk/notes?certificationId=${certificationId}`, {
    method: "POST",
    data: { body },
  })
}

export function updateNote(noteId, changes) {
  return base(`study-desk/notes/${noteId}`, { method: "PATCH", data: changes })
}

export function deleteNote(noteId) {
  return base(`study-desk/notes/${noteId}`, { method: "DELETE" })
}

export function clearNotes(certificationId, completedOnly = false) {
  return base(
    `study-desk/notes?certificationId=${certificationId}&completedOnly=${completedOnly}`,
    { method: "DELETE" }
  )
}
