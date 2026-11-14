// TC-156: Assessment builder validation
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { wrapper } from "./support/ui.jsx"
import "./support/services.js"
const save = vi.hoisted(() => vi.fn())
vi.mock("react-router-dom", async (original) => ({
  ...(await original()),
  useParams: () => ({ departmentId: "1" }),
}))
vi.mock("@/services/institutionService.js", () => ({
  getDepartmentById: async () => ({
    departmentId: 1,
    certifications: [{ certificationId: 1 }],
  }),
}))
vi.mock("@/services/certificationService.js", () => ({
  getCertificationSummary: async () => [
    {
      certificationId: 1,
      majorCategory: [
        {
          majorCategoryId: 1,
          title: "Category",
          middleCategory: [
            {
              middleCategoryId: 2,
              title: "Module",
              lessons: [{ lessonId: 3, name: "Lesson" }],
            },
          ],
        },
      ],
    },
  ],
}))
vi.mock("@/services/assessmentService.js", () => ({
  INSTITUTION_ASSESSMENT_TYPES: [{ value: "QUIZ", label: "Quiz" }],
  createExam: save,
  ensureExamType: vi.fn(),
  getExamById: vi.fn(),
  getExamQuestions: vi.fn(),
  getExamTypes: async () => [],
  updateExam: vi.fn(),
}))
vi.mock("@/components/questions/question-editors.jsx", () => ({
  QUESTION_TYPES: [],
  QuestionTypeButton: () => null,
  cloneQuestionData: vi.fn(),
  createLocalId: vi.fn(),
  saveAuthoredQuestion: vi.fn(),
  validateQuestionData: vi.fn(),
}))
vi.mock("@/components/assessments/admin/exam-format-panel.jsx", () => ({
  default: () => null,
}))
vi.mock(
  "@/components/assessments/admin/assessment-question-picker-dialog.jsx",
  () => ({ default: () => null })
)
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children, disabled }) => (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }) => <>{children}</>,
  SelectGroup: ({ children }) => <>{children}</>,
  SelectLabel: () => null,
  SelectItem: ({ value, children }) => (
    <option value={value}>{children}</option>
  ),
}))
import Page from "@/pages/institution/certifications/institution-assessment-builder-page.jsx"

test("TC-156: Assessment builder validation", async (context) => {
  render(<Page />, { wrapper })
  await screen.findByRole("button", { name: "Create assessment" })
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Week 1 Quiz" },
  })
  await waitFor(() =>
    expect(document.querySelectorAll("select").length).toBeGreaterThanOrEqual(4)
  )
  fireEvent.change(document.querySelectorAll("select")[1], {
    target: { value: "1" },
  })
  fireEvent.change(document.querySelectorAll("select")[2], {
    target: { value: "2" },
  })
  fireEvent.change(document.querySelectorAll("select")[3], {
    target: { value: "3" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Create assessment" }))
  expect(
    await screen.findByText("Add at least one question.")
  ).toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
}, 15000)
