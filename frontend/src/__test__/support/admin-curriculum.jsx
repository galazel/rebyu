import React from "react"
import { vi } from "vitest"
import { render } from "@testing-library/react"
import { wrapper } from "./ui.jsx"
const admin = vi.hoisted(() => ({ get: vi.fn(), remove: vi.fn() }))
export { admin }
vi.mock("react-router-dom", async (original) => ({
  ...(await original()),
  useParams: () => ({ id: "1" }),
}))
vi.mock("@/hooks/use-active-generations", () => ({
  useActiveGenerations: () => ({ byCertificationId: new Map() }),
  generationErrorOf: () => null,
}))
vi.mock("@/services/certificationService.js", () => ({
  getCertificationById: admin.get,
  deleteMajorCategory: admin.remove,
  deleteMiddleCategory: vi.fn(),
  deleteLesson: vi.fn(),
  addLesson: vi.fn(),
  addMajorCategory: vi.fn(),
  addMiddleCategory: vi.fn(),
  updateCertification: vi.fn(),
}))
vi.mock("@/components/assessments/admin/assessments-tab.jsx", () => ({
  prefetchAssessmentData: vi.fn(),
}))
vi.mock(
  "@/components/assessments/admin/certification-publishing-checklist.jsx",
  () => ({ default: () => null })
)
vi.mock(
  "@/components/assessments/admin/certification-exams-section.jsx",
  () => ({ default: () => null })
)
vi.mock("@/components/certifications/generate-more-dialog.jsx", () => ({
  default: () => null,
}))
vi.mock("@/components/certifications/certification-edit-dialog.jsx", () => ({
  default: () => null,
}))
vi.mock("@/components/certifications/inline-generation-monitor.jsx", () => ({
  InlineGenerationMonitor: () => null,
}))
export async function renderCurriculum() {
  let certification = {
    certificationId: 1,
    title: "Networking",
    status: "DRAFT",
    majorCategory: [
      { majorCategoryId: 7, title: "Fundamentals", middleCategory: [] },
    ],
  }
  admin.get.mockImplementation(async () => certification)
  admin.remove.mockImplementation(async () => {
    certification = { ...certification, majorCategory: [] }
  })
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
  const { default: Page } =
    await import("@/pages/admin/view-certification-admin-page.jsx")
  return render(<Page />, { wrapper })
}
