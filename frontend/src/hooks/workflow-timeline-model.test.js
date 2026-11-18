import { buildTasks, buildTranscript, runProgress } from "./workflow-timeline-model.js"

function task(stage, seq, status = "COMPLETED") {
  return { stage, seq, status, itemNumber: null, durationMs: 1000 }
}

describe("document phase grouping", () => {
  it("keeps the whole document phase in one group", () => {
    const groups = buildTranscript([
      task("validate_documents", 1),
      task("capture_document_visuals", 2),
      task("ingest_documents", 3),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe("Source documents")
    expect(groups[0].steps.map((s) => s.stage)).toEqual([
      "validate_documents",
      "capture_document_visuals",
      "ingest_documents",
    ])
  })

  it("does not report the phase complete while a step is still running", () => {
    const groups = buildTranscript([
      task("validate_documents", 1),
      task("capture_document_visuals", 2),
      task("ingest_documents", 3, "RUNNING"),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].status).toBe("RUNNING")
  })

  it("still opens a new group when the family genuinely changes", () => {
    const groups = buildTranscript([
      task("validate_documents", 1),
      task("capture_document_visuals", 2),
      task("ingest_documents", 3),
      task("plan_curriculum", 4),
    ])

    expect(groups.map((g) => g.label)).toEqual(["Source documents", "Curriculum"])
  })
})

describe("final assessment grouping", () => {
  it("puts a later review back under its own exam, not in a new group at the bottom", () => {
    const groups = buildTranscript([
      task("generate_diagnostic_exam", 1),
      task("generate_mock_exam", 2),
      task("generate_question_bank", 3),
      task("audit_questions", 4),
      { ...task("QUESTION_BANK", 5), isReview: true },
      { ...task("DIAGNOSTIC_EXAM", 6, "WAITING_FOR_REVIEW"), isReview: true },
    ])

    expect(groups.map((g) => g.label)).toEqual(["Diagnostic exam", "Mock exam", "Question bank"])
    expect(groups[0].steps.map((s) => s.stage)).toEqual(["generate_diagnostic_exam", "DIAGNOSTIC_EXAM"])
    expect(groups[0].status).toBe("WAITING_FOR_REVIEW")
  })
})

function planEvent(seq, plan) {
  return { seq, payload: { plan } }
}

const PLAN = { majors: 2, middles: 4, lessons: 10 }
const PLAN_TOTAL = 9 + 3 * 10 + 2 * 4 + 2 * 2

describe("run progress", () => {
  it("has no percentage until the curriculum gives it a denominator", () => {
    const progress = runProgress(
      [task("validate_documents", 1), task("capture_document_visuals", 2)],
      [{ seq: 1, payload: {} }],
      "RUNNING",
    )

    expect(progress.percent).toBeNull()
    expect(progress.total).toBeNull()
  })

  it("counts finished steps against the plan the curriculum implies", () => {
    const progress = runProgress(
      [
        task("validate_documents", 1),
        task("capture_document_visuals", 2),
        task("ingest_documents", 3),
        task("plan_curriculum", 4),
      ],
      [planEvent(4, PLAN)],
      "RUNNING",
    )

    expect(progress.total).toBe(PLAN_TOTAL)
    expect(progress.done).toBe(4)
    expect(progress.percent).toBe(Math.round((4 / PLAN_TOTAL) * 100))
  })

  it("does not count a regenerated lesson twice", () => {
    const lesson = (seq, itemNumber) => [
      { ...task("lesson_content", seq), itemNumber },
      { ...task("lesson_quiz_generate", seq + 1), itemNumber },
      { ...task("lesson_validate", seq + 2), itemNumber },
    ]

    const once = runProgress(lesson(1, 1), [planEvent(1, PLAN)], "RUNNING")
    const twice = runProgress(
      [...lesson(1, 1), ...lesson(4, 1)],
      [planEvent(1, PLAN)],
      "RUNNING",
    )

    expect(once.done).toBe(3)
    expect(twice.done).toBe(3)
  })

  it("holds short of 100% while the run is still going, and reaches it when done", () => {
    const plan = { majors: 1, middles: 1, lessons: 1 }
    const every = [
      "check_question_formats",
      "validate_documents",
      "capture_document_visuals",
      "ingest_documents",
      "plan_curriculum",
      "lesson_content",
      "lesson_quiz_generate",
      "lesson_validate",
      "middle_generate",
      "middle_validate",
      "major_generate",
      "major_validate",
      "generate_mock_exam",
      "generate_diagnostic_exam",
      "generate_question_bank",
      "find_duplicates",
    ].map((stage, i) => ({ ...task(stage, i + 1), itemNumber: 1 }))

    const running = runProgress(every, [planEvent(1, plan)], "RUNNING")
    expect(running.done).toBe(running.total)
    expect(running.percent).toBe(99)

    expect(runProgress(every, [planEvent(1, plan)], "COMPLETED").percent).toBe(100)
  })
})

describe("generated output per step", () => {
  const lesson = { title: "Work Measurement", sections: [{ heading: "Time study" }] }
  const quiz = { lesson: "Work Measurement", questions: [{ question: "Q1" }, { question: "Q2" }] }
  const ev = (seq, event_type, stage, extra = {}) => ({ seq, event_type, stage, ...extra })

  it("shows the lesson on its writing step and the quiz on its quiz step, not combined on the review", () => {
    const tasks = buildTasks([
      ev(1, "node.started", "lesson_content", { payload: { item_number: 1 } }),
      ev(2, "node.completed", "lesson_content", { payload: { item_number: 1 } }),
      ev(3, "node.started", "lesson_quiz_generate", { payload: { item_number: 1 } }),
      ev(4, "node.completed", "lesson_quiz_generate", { payload: { item_number: 1 } }),
      ev(5, "version.recorded", "LESSON", { payload: { key: "LESSON:0", artifact: { lesson, quiz } } }),
      ev(6, "review.waiting", "LESSON", { payload: { review: { stage: "LESSON", item_index: 0, payload: { lesson, quiz } } } }),
    ])
    const by = Object.fromEntries(tasks.map((task) => [task.stage + (task.isReview ? ":review" : ""), task]))
    expect(by.lesson_content.artifact).toEqual(lesson)
    expect(by.lesson_quiz_generate.artifact).toEqual(quiz)
    expect(by["LESSON:review"].artifact).toBeUndefined()
  })

  it("keeps the card on the review when the producing step is not in this attempt", () => {
    const tasks = buildTasks([
      ev(1, "review.waiting", "MOCK_EXAM", { payload: { review: { stage: "MOCK_EXAM", payload: { questions: [] } } } }),
    ])
    expect(tasks[0].artifact).toEqual({ questions: [] })
  })
})
