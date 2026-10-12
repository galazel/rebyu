import { base } from "./base.js"

export function getTopicReflection(middleCategoryId) {
  return base(`learners/me/reflections/middle/${middleCategoryId}`)
}

export function submitTopicReflection(middleCategoryId, answer) {
  return base(`learners/me/reflections/middle/${middleCategoryId}/submissions`, {
    method: "POST",
    data: { answer },
  })
}
