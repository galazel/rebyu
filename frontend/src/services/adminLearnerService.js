import { base } from "./base"

export const getAllLearners = () => base("learners")

export const deleteLearner = (learnerId) =>
  base(`learners/${learnerId}`, { method: "DELETE" })
