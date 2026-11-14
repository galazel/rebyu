// TC-133: Question draft mapping
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { mapGeneratedQuestionDraftToQuestionType } from "@/utils/generated-question-draft-mapper.js"

test("TC-133: Question draft mapping", async (context) => {
  const mapped = mapGeneratedQuestionDraftToQuestionType({
    questionType: "MCQ",
    question: "2+2?",
    suggestedLessonId: 7,
    choices: [
      { choiceText: "3", isCorrect: false },
      { choiceText: "4", isCorrect: true },
    ],
  })
  expect(mapped.typeId).toBe("MCQ")
  expect(mapped.data).toMatchObject({
    question: "2+2?",
    lessonId: "7",
    correctChoiceIndex: 1,
  })
  expect(mapped.data.choices[1]).toMatchObject({
    choiceText: "4",
    isCorrect: true,
  })
}, 15000)
