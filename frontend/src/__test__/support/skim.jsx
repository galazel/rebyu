import { vi } from "vitest"

// Shared mocks for the learner skim-challenge hook.
const skim = vi.hoisted(() => ({
  settings: vi.fn(),
  create: vi.fn(),
  start: vi.fn(),
  key: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn() },
}))
export { skim }
vi.mock("sonner", () => ({ toast: skim.toast }))
vi.mock("@/services/aiSettingsService.js", () => ({
  getReadingGuardSettings: skim.settings,
}))
vi.mock("@/services/knowledgeCheckService.js", () => ({
  createKnowledgeCheck: skim.create,
  getKnowledgeCheckKey: skim.key,
}))
vi.mock("@/services/assessmentService.js", () => ({
  startAssessmentAttempt: skim.start,
}))

export function arrangeSkim() {
  skim.settings.mockResolvedValue({ skimCooldownSeconds: 180 })
  skim.create.mockResolvedValue({ examId: 41 })
  skim.start.mockResolvedValue({ assessmentAttemptId: 900 })
  skim.key.mockResolvedValue([])
}
export const cooldownKey = (learnerId) =>
  `rebyu:skim-challenge:cooldown:v2:${learnerId}`
