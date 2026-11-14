// TC-191: CSV download cleanup
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

test("TC-191: CSV download cleanup", async (context) => {
  const create = vi.fn(() => "blob:test")
  const revoke = vi.fn()
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = create
      static revokeObjectURL = revoke
    }
  )
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {})
  downloadCsv("test.csv", "a,b")
  expect(create).toHaveBeenCalledTimes(1)
  expect(click).toHaveBeenCalledOnce()
  expect(revoke).toHaveBeenCalledWith("blob:test")
  expect(document.querySelector('a[download="test.csv"]')).toBeNull()
  vi.unstubAllGlobals()
}, 15000)
