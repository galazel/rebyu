export const model = "openrouter/provider-with-a-long-name/education-model-with-extended-context:free"
export const alternative = "openrouter/another-provider/education-alternative-with-extended-context"
export const task = {
  task: "tutor", label: "Guided tutor dialogue and certification question generation",
  usedFor: ["Guided teaching, explanations, and practice"], provider: "openrouter",
  model, configuredModel: model, overridden: true, changeable: true,
  needsVision: false, blocked: [], fallbacks: [alternative],
  recommended: [{ id: alternative, note: "Recommended educational model with a long description", free: true }],
}
export const ai = {
  credits: { available: true, remaining: 123456.78, totalCredits: 9876543.21, totalUsage: 12345.67, key: { limit: 999999, limitRemaining: 123456, usageDaily: 12345.67, usageMonthly: 23456.78 } },
  providers: { openrouter: true }, tasks: [task],
  models: [{ id: alternative, free: true }],
  modelHealth: { [model]: { state: "cooling_down", availableInSeconds: 123,
    successes: 123, failures: 3, avgLatencyMs: 3000, lastTask: "tutor",
    lastError: { label: "Provider limit reached", advice: "Try the alternative model.", message: "VeryLongProviderError".repeat(20), task: "tutor", at: new Date().toISOString() },
  }, [alternative]: { state: "ok", successes: 55, lastTask: "tutor" } },
}
export const live = {
  settings: { enabled: true, maxDurationSeconds: 1800, voiceId: "long_educational_voice_id" },
  proLimits: { dailyMessages: 50, weeklyMessages: 250 },
  credits: { available: true, remaining: 1234567, used: 1234567, limit: 9999999, tier: "Professional educational teaching plan" },
  voices: [{ id: "long_educational_voice_id", name: "An educational voice with a very long descriptive name", category: "professional" }],
}

export const certification = {
  certificationId: 1, title: "Certification with a complete course structure", status: "PUBLISHED",
  majorCategory: Array.from({ length: 5 }, (_, major) => ({ title: `Major ${major + 1}`, middleCategory: [{ title: "Foundations and programming", lessons: Array.from({ length: 20 }, (_, index) => ({ lessonId: major * 20 + index + 1, name: `Lesson ${String(major * 20 + index + 1).padStart(3, "0")} — Discrete Mathematics, Algorithms and Extended Programming Fundamentals` })) }] })),
}
export const directoryLearners = Array.from({ length: 24 }, (_, i) => ({ learnerId: i + 1, firstName: `Learner ${String(i + 1).padStart(2, "0")}`, lastName: "Example", email: `learner${i}@example.test`, institutionName: i % 2 ? "Cebu Institute of Technology — University" : null, learnerType: i % 2 ? "institution" : "individual", status: i % 3 ? "active" : "pending", certificationCount: 3, progressPercentage: 67, joinedAt: "2026-06-18" }))
export const directoryInstitutions = Array.from({ length: 14 }, (_, i) => ({ institutionId: i + 1, institutionName: `Institution ${String(i + 1).padStart(2, "0")} with an extended university name`, primaryContactName: "Institution contact", primaryContactEmail: `contact${i}@example.test`, status: i % 2 ? "active" : "pending", learnerCount: 120, certificationCount: 5, joinedAt: "2026-06-18" }))
export const directoryRequests = [{ requestId: 1, institutionName: "Cebu Institute of Technology — University", institutionEmail: "institution@example.test", referenceNumber: "REQ-0001", status: "PENDING", requestType: "NEW", submittedAt: "2026-06-18" }]
