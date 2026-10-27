import { base } from "./base.js"

export function getAiSettings() {
  return base("ai/settings")
}

export function getLiveTutorSettings() { return base("ai/settings/live-tutor") }
export function updateLiveTutorSettings(data) { return base("ai/settings/live-tutor", { method: "PUT", data }) }

export function chooseAiModel(task, model) {
  return base(`ai/settings/${encodeURIComponent(task)}`, {
    method: "PUT",
    data: { model },
  })
}

export function resetAiModel(task) {
  return base(`ai/settings/${encodeURIComponent(task)}`, { method: "DELETE" })
}
