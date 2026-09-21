import { base } from "./base.js"

// Ownership is inherited from majorCategoryId's ancestor -- no ownerDepartmentId
// parameter here, see MiddleCategoryService.java.
export async function createMiddleCategory(data) {
  return await base("middle-categories", {
    method: "POST",
    data,
  })
}

export async function deleteMiddleCategory(id) {
  return await base(`middle-categories/${id}`, { method: "DELETE" })
}
