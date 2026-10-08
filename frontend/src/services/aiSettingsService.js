import { base } from "./base.js"

export function getAiSettings() {
  return base("ai/settings")
}

export function chooseAiModel(task, model) {
  return base(`ai/settings/${encodeURIComponent(task)}`, {
    method: "PUT",
    data: { model },
  })
}

export function resetAiModel(task) {
  return base(`ai/settings/${encodeURIComponent(task)}`, { method: "DELETE" })
}
