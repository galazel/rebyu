// TC-134: Lesson draft mapping
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect } from "vitest"
import { mapGeneratedLessonDraftsToSections } from "@/utils/generated-lesson-draft-mapper.js"

test("TC-134: Lesson draft mapping", async (context) => {
  const content = mapGeneratedLessonDraftsToSections({
    sections: [
      {
        id: "s1",
        sectionName: "Introduction",
        content: [
          {
            id: "b1",
            type: "image",
            data: { imageKey: "fixture.png", caption: "Example" },
          },
        ],
      },
    ],
  })
  expect(content).toEqual([
    {
      id: "s1",
      sectionName: "Introduction",
      content: [
        {
          id: "b1",
          type: "image",
          data: { imageKey: "fixture.png", caption: "Example", file: null },
        },
      ],
    },
  ])
}, 15000)
