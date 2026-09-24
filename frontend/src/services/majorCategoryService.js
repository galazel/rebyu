import { base } from "./base.js"

// ownerDepartmentId is required for a department head creating their own
// content; omitted, the backend requires ADMIN and creates official content.
export async function createMajorCategory(data, ownerDepartmentId) {
  const query = ownerDepartmentId != null ? `?ownerDepartmentId=${ownerDepartmentId}` : ""
  return await base(`major-categories${query}`, {
    method: "POST",
    data,
  })
}

export async function deleteMajorCategory(id) {
  return await base(`major-categories/${id}`, { method: "DELETE" })
}
