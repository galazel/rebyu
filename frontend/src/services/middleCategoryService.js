import { base } from "./base.js"

export async function createMiddleCategory(data) {
  return await base("middle-categories", {
    method: "POST",
    data,
  })
}

export async function deleteMiddleCategory(id) {
  return await base(`middle-categories/${id}`, { method: "DELETE" })
}
