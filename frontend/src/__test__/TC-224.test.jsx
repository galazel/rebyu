// TC-224: Back from a result must not restart the assessment
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test, expect, beforeEach } from "vitest"
import {
  finishedAttemptKey,
  finishedAttemptToShow,
  forgetFinishedAttempt,
  rememberFinishedAttempt,
} from "@/lib/finished-attempt.js"

beforeEach(() => {
  sessionStorage.clear()
})

// The assessment page starts an attempt the moment it mounts, so Back from the
// result page used to begin a SECOND sitting of a paper just handed in -- new
// clock, and the exit recorded against the learner.
test("TC-224: Back after submitting shows the result instead of a new attempt", () => {
  rememberFinishedAttempt(727, 9, null, 712)

  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 9, questionIndex: null, navigationType: "POP" })
  ).toBe("712")

  // Still true on a second Back, and on a reload of the same URL.
  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 9, questionIndex: null, navigationType: "POP" })
  ).toBe("712")
})

test("TC-224: asking for the paper again starts a new attempt", () => {
  rememberFinishedAttempt(727, 9, null, 712)

  // "Retake assessment" is a Link, which is a PUSH.
  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 9, questionIndex: null, navigationType: "PUSH" })
  ).toBe(null)

  // And the mark is gone, so Back during the new sitting does not jump to the
  // old result either.
  expect(sessionStorage.getItem(finishedAttemptKey(727, 9, null))).toBe(null)
  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 9, questionIndex: null, navigationType: "POP" })
  ).toBe(null)
})

test("TC-224: each exam, learner and arena problem is remembered separately", () => {
  rememberFinishedAttempt(727, 9, null, 712)
  rememberFinishedAttempt(727, 9, 2, 713)

  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 9, questionIndex: 2, navigationType: "POP" })
  ).toBe("713")
  expect(
    finishedAttemptToShow({ examId: 731, learnerId: 9, questionIndex: null, navigationType: "POP" })
  ).toBe(null)
  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 44, questionIndex: null, navigationType: "POP" })
  ).toBe(null)

  forgetFinishedAttempt(727, 9, null)
  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 9, questionIndex: null, navigationType: "POP" })
  ).toBe(null)
})

test("TC-224: a paper never submitted still starts normally", () => {
  expect(
    finishedAttemptToShow({ examId: 727, learnerId: 9, questionIndex: null, navigationType: "POP" })
  ).toBe(null)
})
