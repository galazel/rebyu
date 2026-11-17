import React from "react"
import { vi } from "vitest"
import { render } from "@testing-library/react"
import { wrapper } from "./ui.jsx"

// Shared mocks for the CodeStrike / Blueprint stage result screen.
const stage = vi.hoisted(() => ({ arenas: vi.fn() }))
export { stage }
vi.mock("@/services/challengeService.js", () => ({
  CHALLENGE_ARENAS_KEY: "challenge-arenas",
  getChallengeArenas: stage.arenas,
  getWorldCupBracketForMatch: vi.fn(),
}))
vi.mock("@/services/learnerService.js", () => ({
  getLearnerPortalData: vi.fn(async () => ({})),
}))
vi.mock("@/components/challenges/arena-podium.jsx", () => ({
  ArenaPodium: () => null,
}))
vi.mock("@/components/challenges/score-breakdown.jsx", () => ({
  ScoreBreakdown: () => null,
}))
vi.mock("@/components/challenges/arena-lobby.jsx", () => ({
  PathBackdrop: () => null,
  Plinth: () => null,
}))

export async function renderStageResult({
  percentage,
  passScore,
  questionIndex = 0,
  totalProblems = 3,
  marking = false,
}) {
  stage.arenas.mockResolvedValue([
    {
      arenaId: "codestrike",
      settings: passScore == null ? {} : { passScore },
    },
  ])
  const { default: ChallengeResult } =
    await import("@/components/challenges/challenge-result.jsx")
  return render(
    <ChallengeResult
      result={{
        assessmentId: 5,
        assessmentTitle: "CodeStrike",
        percentage,
        correctCount: 1,
        incorrectCount: 1,
        durationSeconds: 90,
      }}
      state={{ arenaId: "codestrike", questionIndex, totalProblems }}
      marking={marking}
    />,
    { wrapper }
  )
}
