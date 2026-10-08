import { base } from "./base.js"

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
