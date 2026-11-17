import React from "react"
import { vi } from "vitest"
import { render } from "@testing-library/react"
import { wrapper } from "./ui.jsx"

// Shared mocks for the learner arena lobby (stage trail).
const lobby = vi.hoisted(() => ({ arenas: vi.fn(), progress: vi.fn() }))
export { lobby }
vi.mock("@/services/challengeService.js", () => ({
  CHALLENGE_ARENAS_KEY: "challenge-arenas",
  getChallengeArenas: lobby.arenas,
  getArenaProblems: vi.fn(async () => []),
  getArenaProgress: lobby.progress,
}))
vi.mock("@/context/auth-context.jsx", () => ({
  useAuth: () => ({ user: { role: "LEARNER" } }),
}))
vi.mock("@/components/challenges/arena-podium.jsx", () => ({
  ArenaPodium: () => null,
}))

export async function renderLobby({ arena, completedStages = [] }) {
  lobby.arenas.mockResolvedValue([
    {
      arenaId: "codestrike",
      configured: true,
      examId: 5,
      problemCount: 3,
      settings: { timePerProblem: 10, pointsPerProblem: 10 },
      ...arena,
    },
  ])
  lobby.progress.mockResolvedValue({
    questionIds: [],
    stageIndexes: completedStages,
  })
  const { ArenaLobby } = await import("@/components/challenges/arena-lobby.jsx")
  return render(
    <ArenaLobby arenaId="codestrike" name="CodeStrike" blurb="Coding stages" />,
    { wrapper }
  )
}
