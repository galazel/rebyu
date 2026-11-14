// TC-192: Portal content search
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

test("TC-192: Portal content search", async (context) => {
  const items = buildPortalContentItems({
    role: "learner",
    enrolledCertifications: [
      { certificationId: 7, title: "Network Certification" },
    ],
    lessons: [
      { lessonId: 1, name: "Network Basics", certificationId: 7 },
      { lessonId: 2, name: "Private Lesson", certificationId: 8 },
    ],
  })
  expect(searchPortalContent(items, "network basics").map((x) => x.id)).toEqual(
    ["lesson:1"]
  )
  expect(items.some((x) => x.id === "lesson:2")).toBe(false)
}, 15000)
