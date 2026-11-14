// TC-088: Pomodoro start and pause
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

test("TC-088: Pomodoro start and pause", async (context) => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-11-12T00:00:00Z"))
  startPomodoro({ id: 7 }, { focusMinutes: 1 })
  const deadline = pomodoroSnapshot().deadline
  vi.advanceTimersByTime(15000)
  expect(deadline - Date.now()).toBe(45000)
  pausePomodoro()
  expect(pomodoroSnapshot()).toMatchObject({
    stage: "paused",
    pausedLeft: 45000,
    deadline: null,
  })
  vi.advanceTimersByTime(10000)
  tickPomodoro()
  expect(pomodoroSnapshot().pausedLeft).toBe(45000)
  endPomodoro()
}, 15000)
