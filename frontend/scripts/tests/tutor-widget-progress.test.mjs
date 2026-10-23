import test from "node:test"
import assert from "node:assert/strict"
import { widgetProgressKey, tutorActivityScope, readWidgetField, writeWidgetField } from "../../src/lib/tutor-widget-progress.js"

const values = new Map()
globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
const quiz = { type: "quiz", title: "Quiz", questions: [{ question: "One?", options: ["A", "B"], correctIndex: 0 }] }
test("keys survive library enrichment and object property ordering", () => {
  assert.equal(widgetProgressKey("9-246", quiz), widgetProgressKey("9-246", { questions: quiz.questions, library: { route: "/library/1" }, title: "Quiz", type: "quiz" }))
  assert.notEqual(widgetProgressKey("9-246", quiz), widgetProgressKey("10-246", quiz))
  assert.notEqual(widgetProgressKey("9-246", quiz), widgetProgressKey("9-246-new-chat", quiz))
  assert.notEqual(widgetProgressKey("9-246", quiz), widgetProgressKey("9-246", { ...quiz, title: "New quiz" }))
})
test("activity identity ignores extra non-activity history messages", () => {
  assert.equal(tutorActivityScope("9-246", [{ role: "user" }, { widgets: [quiz] }], 1), tutorActivityScope("9-246", [{ role: "user" }, { role: "assistant" }, { widgets: [quiz] }], 2))
})
test("fields merge and explicit reset persists", () => {
  const key = widgetProgressKey("9-246", quiz)
  writeWidgetField(key, "answers", { 0: 1 })
  writeWidgetField(key, "hint", true)
  assert.deepEqual(readWidgetField(key, "answers", {}), { 0: 1 })
  assert.equal(readWidgetField(key, "hint", false), true)
  writeWidgetField(key, "answers", {})
  assert.deepEqual(readWidgetField(key, "answers", {}), {})
  values.set(key, "broken")
  assert.deepEqual(readWidgetField(key, "answers", {}), {})
  writeWidgetField(key, "answers", { 0: 0 })
  assert.deepEqual(readWidgetField(key, "answers", {}), { 0: 0 })
})
