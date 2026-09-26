import { base } from "./base.js"

/**
 * The challenge leaderboard, ranked and named server-side.
 *
 * Replaces `getChallengeGamificationData`, which fetched every challenge
 * session on the platform plus every learner record just to render ten rows --
 * and, when the learner list refused the request, left the page showing
 * invented names. Each row is already ranked, already named, and already knows
 * whether it is the caller.
 */
export async function getChallengeLeaderboard(limit = 10) {
  const rows = await base(`challenges/leaderboard?limit=${limit}`)
  return Array.isArray(rows) ? rows : []
}

/** The caller's own rank, totals, streak and recent sessions. */
export async function getMyChallengeRecord() {
  return base("challenges/me/record")
}

// Arenas. An arena's problems are a CHALLENGE exam, so configuring one is
// admin work and running one is an ordinary attempt.

export const CHALLENGE_ARENAS_KEY = "challenge-arenas"

/**
 * Every arena and whether it is ready to run.
 *
 * `configured` is what the learner's cards lock against: an arena with no
 * problems opens onto nothing, and finding that out after clicking in is worse
 * than being told on the card.
 */
export async function getChallengeArenas() {
  return base("challenge-arenas")
}

/**
 * Replaces an arena's problem set (admin).
 *
 * The questions are saved to the bank first, through the same endpoints the
 * question bank uses -- this only records which of them the arena runs.
 */
export async function saveArenaProblems(arenaId, { certificationId, timeLimitMinutes, problems }) {
  return base(`challenge-arenas/${arenaId}/problems`, {
    method: "PUT",
    data: { certificationId, timeLimitMinutes, problems },
  })
}

/**
 * The arena's saved problem set, for the builder to reload (admin). Each row is
 * `{ questionId, nodeIndex, displayOrder, points, question, subQuestions }`.
 */
export async function getArenaProblems(arenaId) {
  const rows = await base(`challenge-arenas/${arenaId}/problems`)
  return Array.isArray(rows) ? rows : []
}

/**
 * Replaces an arena's run settings (admin). The server checks every key and
 * bound, and writes the time limit through to the exam learners sit.
 */
export async function saveArenaSettings(arenaId, settings) {
  return base(`challenge-arenas/${arenaId}/settings`, { method: "PUT", data: settings })
}

/** Opens or pauses an arena for learners (admin). Problems are kept either way. */
export async function setArenaLive(arenaId, live) {
  return base(`challenge-arenas/${arenaId}/live`, { method: "PUT", data: { live } })
}

/** Replaces the certifications switched off as World Cup tracks (admin). */
export async function setWorldCupDisabledTracks(disabledCertificationIds) {
  return base("challenge-arenas/worldcup/tracks", {
    method: "PUT",
    data: { disabledCertificationIds },
  })
}

// World Cup weekly editions (admin). A draft is stored server-side; only
// publishing reaches learners.

export const WORLD_CUP_EDITIONS_KEY = "world-cup-editions"

export async function getWorldCupEditions() {
  const rows = await base("challenge-arenas/worldcup/editions")
  return Array.isArray(rows) ? rows : []
}

/** One edition with every stage's questions: `{ edition, stages: { stageId: rows } }`. */
export async function getWorldCupEdition(editionId) {
  return base(`challenge-arenas/worldcup/editions/${editionId}`)
}

export async function createWorldCupEdition({ weekStart, certificationId, lessonId }) {
  return base("challenge-arenas/worldcup/editions", {
    method: "POST",
    data: { weekStart, certificationId, lessonId },
  })
}

/** Replaces an edition's stage sets: `{ quarterfinal: [questionId], ... }`. */
export async function saveWorldCupEditionStages(editionId, stages) {
  return base(`challenge-arenas/worldcup/editions/${editionId}/stages`, {
    method: "PUT",
    data: { stages },
  })
}

export async function publishWorldCupEdition(editionId) {
  return base(`challenge-arenas/worldcup/editions/${editionId}/publish`, { method: "POST" })
}

export async function deleteWorldCupEdition(editionId) {
  return base(`challenge-arenas/worldcup/editions/${editionId}`, { method: "DELETE" })
}

/** Empties an arena, locking it again for learners (admin). */
export async function clearArenaProblems(arenaId) {
  return base(`challenge-arenas/${arenaId}/problems`, { method: "DELETE" })
}

