// TC-089: Pomodoro reset
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

test("TC-089: Pomodoro reset", async (context) => {
  vi.useFakeTimers()
  startPomodoro({ id: 7 }, { focusMinutes: 1 })
  vi.advanceTimersByTime(15000)
  endPomodoro()
  expect(pomodoroSnapshot()).toBeNull()
  startPomodoro({ id: 7 }, { focusMinutes: 1 })
  expect(pomodoroSnapshot().deadline - Date.now()).toBe(60000)
  expect(pomodoroSnapshot().index).toBe(0)
  endPomodoro()
}, 15000)
