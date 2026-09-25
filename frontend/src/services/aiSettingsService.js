import { base } from "./base.js"

/**
 * The OpenRouter balance, the providers with a key, and every AI task: where
 * it runs, the model it uses, and the models recommended for it.
 */
export function getAiSettings() {
  return base("ai/settings")
}

/** Runs `task` on `model` from now on (within about 30 seconds). */
export function chooseAiModel(task, model) {
  return base(`ai/settings/${encodeURIComponent(task)}`, {
    method: "PUT",
    data: { model },
  })
}

/** Puts `task` back on the model configured for the deployment. */
export function resetAiModel(task) {
  return base(`ai/settings/${encodeURIComponent(task)}`, { method: "DELETE" })
}
