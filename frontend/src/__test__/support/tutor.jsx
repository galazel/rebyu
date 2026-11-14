import React from "react"
import { vi } from "vitest"
import { render } from "@testing-library/react"
import { wrapper } from "./ui.jsx"
import { request } from "./services.js"
vi.mock("@/hooks/use-learner-entitlements.js", () => ({
  useLearnerEntitlements: () => ({ isFree: false, hasFeature: () => true }),
}))
vi.mock("@/components/learner/ai-usage.jsx", () => ({
  AiLimitNotice: () => null,
  AiUsageRing: () => null,
  isBucketExhausted: () => false,
  useAiUsage: () => ({ bucket: () => null, refresh: () => {} }),
}))
vi.mock("@/components/learner/live-tutor.jsx", () => ({
  LiveTutor: () => null,
  LiveTutorVoiceOrb: () => null,
}))
vi.mock("@/components/learner/mic-button.jsx", () => ({
  MicButton: () => null,
}))
vi.mock("@/components/learner/tutor-widgets.jsx", () => ({
  TutorWidgets: () => null,
}))
vi.mock("@/components/learner/tutor-dialogue.jsx", () => ({
  TutorDialogue: () => null,
}))
vi.mock("@/components/ui/message-scroller", () => {
  const Box = ({ children }) => <div>{children}</div>
  return {
    MessageScroller: Box,
    MessageScrollerButton: () => null,
    MessageScrollerContent: Box,
    MessageScrollerItem: Box,
    MessageScrollerProvider: Box,
    MessageScrollerViewport: Box,
  }
})
export async function renderTutor() {
  request.mockImplementation((endpoint) =>
    Promise.resolve(
      endpoint.startsWith("ai/tutor/conversation") ? { messages: [] } : {}
    )
  )
  const { LessonAiTutor } =
    await import("@/components/learner/lesson-ai-tutor.jsx")
  return render(
    <LessonAiTutor
      lessonId={7}
      lessonName="Networking"
      learnerId={9}
      learnerName="Ivan"
      onClose={() => {}}
    />,
    { wrapper }
  )
}
