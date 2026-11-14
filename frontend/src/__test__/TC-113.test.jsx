// TC-113: Tutor study-set conversion
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, vi } from "vitest"
import {
  certificationProgressPercent,
  findCertificationProgress,
} from "@/lib/certification-progress.js"
import {
  rememberLessonCompleted,
  wasLessonCompletedThisSession,
  forgetLessonCompleted,
} from "@/lib/lesson-completion.js"
import { choicesCanShuffle } from "@/lib/choice-shuffle.js"
import { returnPath, returnState } from "@/lib/assessment-return.js"
import { formatCountdown, describeCountdown } from "@/lib/countdown.js"
import {
  minutesOfDay,
  toDateKey,
  isDue,
  isTriggerable,
  isStale,
} from "@/lib/study-schedule.js"
import {
  startPomodoro,
  pausePomodoro,
  tickPomodoro,
  pomodoroSnapshot,
  endPomodoro,
} from "@/lib/pomodoro-store.js"
import { tutorStudyItems, studyIndex } from "@/lib/tutor-study-set.js"
import { toCsv, timestampedFilename, downloadCsv } from "@/lib/csv.js"
import {
  buildPortalContentItems,
  searchPortalContent,
} from "@/lib/portal-content-search.js"

test("TC-113: Tutor study-set conversion", async (context) => {
  expect(
    tutorStudyItems({
      type: "quiz",
      questions: [
        {
          question: "2+2?",
          options: ["3", "4"],
          correctIndex: 1,
          explanation: "Addition",
        },
      ],
    })
  ).toEqual([
    {
      front: "2+2?",
      back: "4",
      options: ["3", "4"],
      correctIndex: 1,
      explanation: "Addition",
    },
  ])
  const cards = tutorStudyItems({
    type: "flashcards",
    cards: [
      { front: "A", back: "B" },
      { front: "C", back: "D" },
    ],
  })
  expect(cards[0].options[cards[0].correctIndex]).toBe("B")
}, 15000)
