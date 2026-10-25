import assert from "node:assert/strict"
import { studyIndex, tutorStudyItems } from "../../src/lib/tutor-study-set.js"
const quiz = { type: "quiz", questions: [{ question: "Contribution?", options: ["100", "200", "300"], correctIndex: 1, explanation: "Price minus variable cost." }] }
const items = tutorStudyItems(quiz)
assert.equal(items[0].front, "Contribution?")
assert.equal(items[0].back, "200")
assert.equal(items[0].explanation, quiz.questions[0].explanation)
assert.equal(items[0].options[items[0].correctIndex], items[0].back)
const cards = { type: "flashcards", cards: [{ front: "A", back: "Answer A" }, { front: "B", back: "Answer B" }, { front: "C", back: "Answer A" }] }
for (const item of tutorStudyItems(cards)) {
  assert.equal(item.options[item.correctIndex], item.back)
  assert.equal(new Set(item.options).size, item.options.length)
}
assert.deepEqual(tutorStudyItems({ type: "flashcards", cards: [cards.cards[0]] })[0].options, [], "one card uses self-check instead of fabricated choices")
assert.deepEqual(tutorStudyItems({ type: "quiz" }), [])
assert.equal(studyIndex(999, 3), 2)
assert.equal(studyIndex(-1, 3), 0)
assert.equal(studyIndex("invalid", 3), 0)
console.log("PASS: shared quiz/flashcard content, stable distractors, duplicate handling, single-card self-check, safe navigation.")
