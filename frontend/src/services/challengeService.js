import { base } from "./base.js"

export async function getChallengeLeaderboard(limit = 10) {
  const rows = await base(`challenges/leaderboard?limit=${limit}`)
  return Array.isArray(rows) ? rows : []
}

export async function getMyChallengeRecord() {
  return base("challenges/me/record")
}


export const CHALLENGE_ARENAS_KEY = "challenge-arenas"

export async function getChallengeArenas() {
  return base("challenge-arenas")
}

export async function saveArenaProblems(arenaId, { certificationId, timeLimitMinutes, problems }) {
  return base(`challenge-arenas/${arenaId}/problems`, {
    method: "PUT",
    data: { certificationId, timeLimitMinutes, problems },
  })
}

export async function getArenaProblems(arenaId) {
  const rows = await base(`challenge-arenas/${arenaId}/problems`)
  return Array.isArray(rows) ? rows : []
}

export async function saveArenaSettings(arenaId, settings) {
  return base(`challenge-arenas/${arenaId}/settings`, { method: "PUT", data: settings })
}

export async function setArenaLive(arenaId, live) {
  return base(`challenge-arenas/${arenaId}/live`, { method: "PUT", data: { live } })
}

export async function setWorldCupDisabledTracks(disabledCertificationIds) {
  return base("challenge-arenas/worldcup/tracks", {
    method: "PUT",
    data: { disabledCertificationIds },
  })
}


export const WORLD_CUP_EDITIONS_KEY = "world-cup-editions"

export async function getWorldCupEditions() {
  const rows = await base("challenge-arenas/worldcup/editions")
  return Array.isArray(rows) ? rows : []
}

export async function getWorldCupEdition(editionId) {
  return base(`challenge-arenas/worldcup/editions/${editionId}`)
}

export async function createWorldCupEdition({ weekStart, certificationId, lessonId }) {
  return base("challenge-arenas/worldcup/editions", {
    method: "POST",
    data: { weekStart, certificationId, lessonId },
  })
}

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

export async function clearArenaProblems(arenaId) {
  return base(`challenge-arenas/${arenaId}/problems`, { method: "DELETE" })
}


export async function joinWorldCupQueue(certificationId) {
  return base("worldcup/queue", { method: "POST", data: { certificationId } })
}

export async function leaveWorldCupQueue(certificationId) {
  return base(`worldcup/queue?certificationId=${certificationId}`, { method: "DELETE" })
}

export async function getWorldCupQueueStatus(certificationId) {
  return base(`worldcup/queue?certificationId=${certificationId}`)
}

export async function getWorldCupBracket(bracketId) {
  return base(`worldcup/brackets/${bracketId}`)
}

export async function getMyWorldCupBracket() {
  return base("worldcup/my-bracket")
}

export async function getWorldCupHistory() {
  return base("worldcup/history")
}

export async function reportWorldCupScore(matchId, attemptId, score) {
  return base(`worldcup/matches/${matchId}/score`, {
    method: "POST",
    data: { attemptId, score },
  })
}

export async function seedWorldCupBots(certificationId, count = 7) {
  return base("worldcup/test/seed-bots", { method: "POST", data: { certificationId, count } })
}
export async function simulateBotScores(bracketId) {
  return base("worldcup/test/bot-scores", { method: "POST", data: { bracketId } })
}
export async function cleanupWorldCupTest() {
  return base("worldcup/test/cleanup", { method: "POST" })
}

