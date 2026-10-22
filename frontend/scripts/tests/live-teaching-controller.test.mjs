import test from "node:test"
import assert from "node:assert/strict"
import { LiveTeachingController, cleanSpeechText } from "../../src/lib/live-teaching-controller.js"

function harness() {
  let now = 0, sequence = 0
  const timers = new Map(), requests = [], saved = []
  const teacher = new LiveTeachingController({ request: (value) => requests.push(value), persist: (value) => saved.push(value), now: () => now,
    schedule: (callback, delay) => { const id = ++sequence; timers.set(id, { callback, at: now + delay }); return id }, cancel: (id) => timers.delete(id) })
  function tick(ms) {
    const end = now + ms
    for (let count = 0; count < 100; count++) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      now = due[1].at; timers.delete(due[0]); due[1].callback()
    }
    now = end
  }
  function segment(kind = "explain", text = "A sale contributes to fixed costs.", extra = {}) {
    teacher.structuredStep({ kind, concept: "contribution", sectionId: "section-1", questionKey: "question-1", ...extra })
    teacher.agentMessage(text); teacher.audio(true); teacher.audio(false)
  }
  teacher.start()
  return { teacher, requests, saved, tick, segment }
}

test("closing suspends teaching and restores the unfinished concept on reopening", () => {
  const h = harness()
  h.teacher.structuredStep({ kind: "explain", concept: "contribution", sectionId: "section-3", completedConcept: "fixed costs" })
  h.teacher.agentMessage("Contribution is selling price minus variable cost.")
  h.teacher.audio(true)
  h.teacher.suspend()
  const checkpoint = h.saved.at(-1)
  assert.equal(checkpoint.phase, "PAUSED")
  assert.equal(checkpoint.sectionId, "section-3")
  assert.match(checkpoint.unfinishedSegment, /selling price/)
  h.tick(60000)
  assert.equal(h.requests.length, 0)
  const reopened = harness()
  reopened.teacher.start(checkpoint)
  assert.equal(reopened.teacher.state.concept, "contribution")
  assert.deepEqual(reopened.teacher.state.completedConcepts, ["fixed costs"])
  assert.equal(reopened.teacher.state.sectionId, "section-3")
})

test("closing an actually completed lesson preserves completion", () => {
  const h = harness()
  h.segment("complete", "That completes our review.")
  h.teacher.suspend()
  assert.equal(h.teacher.state.phase, "COMPLETED")
})

test("ordinary explanations schedule the next action only after audio ends", () => {
  const h = harness()
  h.teacher.structuredStep({ kind: "explain", concept: "contribution" })
  h.teacher.agentMessage("Each sale helps cover fixed costs.")
  h.teacher.audio(true); h.tick(30000); assert.equal(h.requests.length, 0)
  h.teacher.audio(false); h.tick(1600); assert.equal(h.requests.length, 1)
  assert.match(h.requests[0], /Continue the teaching plan/)
  h.tick(10000); assert.equal(h.requests.length, 1, "only one pending response is requested")
})
test("opening diagnostic listens, then hints once and continues after unanswered question", () => {
  const h = harness()
  h.segment("diagnostic", "What do you already know about contribution?")
  h.tick(19999); assert.equal(h.requests.length, 0)
  h.tick(1); assert.equal(h.requests.length, 1); assert.match(h.requests[0], /ONE useful hint/)
  h.segment("diagnostic", "Think about what is left after variable costs. What is that amount?")
  h.tick(15000); assert.equal(h.requests.length, 2); assert.match(h.requests[1], /Do not infer agreement or mastery/)
})
test("real oral answer cancels timeout, feedback automatically returns to teaching", () => {
  const h = harness()
  h.segment("recitation", "What is one hundred minus sixty?")
  h.teacher.studentMessage("Forty"); h.tick(30000); assert.equal(h.requests.length, 0)
  assert.equal(h.teacher.state.phase, "EVALUATING_ANSWER")
  h.segment("feedback", "Correct: forty remains after variable costs.")
  h.tick(1600); assert.equal(h.requests.length, 1)
})
test("interruption takes priority and preserves the unfinished concept", () => {
  const h = harness(); h.segment()
  h.teacher.interrupt(); h.tick(30000); assert.equal(h.requests.length, 0)
  assert.match(h.teacher.state.unfinishedSegment, /fixed costs/)
  h.teacher.studentMessage("What are fixed costs?")
  h.segment("feedback", "Costs that don't change with output, like rent.")
  h.tick(1600); assert.equal(h.requests.length, 1)
})
test("explicit pause stops progression and resumes without permission questions", () => {
  const h = harness(); h.segment(); h.teacher.pause()
  h.teacher.audio(false); h.teacher.speech(true); h.tick(60000)
  assert.equal(h.requests.length, 0); assert.equal(h.teacher.state.phase, "PAUSED")
  h.teacher.resume(); assert.equal(h.requests.length, 1); assert.match(h.requests[0], /Do not ask permission/)
})
test("silent VAD frames do not postpone autonomous continuation", () => {
  const h = harness(); h.segment()
  for (let i = 0; i < 20; i++) { h.teacher.speech(false); h.tick(100) }
  assert.equal(h.requests.length, 1)
})
test("completion is explicit, persists concept checkpoint, and cancels the loop", () => {
  const h = harness(); h.segment("summary", "We covered contribution and break-even.", { completedConcept: "break-even" })
  assert.notEqual(h.teacher.state.phase, "COMPLETED")
  h.segment("complete", "Good work today."); h.tick(60000)
  assert.equal(h.requests.length, 0); assert.equal(h.teacher.state.phase, "COMPLETED")
  assert.deepEqual(h.teacher.state.completedConcepts, ["break-even"])
})
test("reconnection restores teaching checkpoint; invalid actions are rejected", () => {
  const h = harness()
  h.teacher.start({ completedConcepts: ["contribution"], concept: "break-even", sectionId: "break-even" })
  assert.equal(h.teacher.state.concept, "break-even")
  assert.equal(h.teacher.structuredStep({ kind: "execute_javascript", concept: "x" }).ok, false)
  h.teacher.dispose(); h.tick(60000); assert.equal(h.requests.length, 0)
})
test("speech tags are stripped from readable transcripts", () => {
  assert.equal(cleanSpeechText("[happy] Exactly. [calm] Fixed costs stay the same."), "Exactly. Fixed costs stay the same.")
})
test("changing a hint's question ID cannot reset the unanswered response budget", () => {
  const h = harness(); h.segment("question", "What is contribution?")
  h.tick(20000)
  h.segment("question", "Think about costs. What remains?", { questionKey: "different-hint-key" })
  h.tick(15000)
  assert.equal(h.requests.length, 2); assert.match(h.requests[1], /model answer/)
})
test("network timeout becomes a recoverable error instead of indefinite waiting", () => {
  const h = harness(); h.segment(); h.tick(1600); h.tick(30000)
  assert.equal(h.teacher.state.phase, "ERROR")
  assert.equal(h.teacher.active, false)
  assert.ok(h.saved.some((state) => state.recentEvents.some(({ event }) => event === "response_timed_out")))
})
test("corrected interrupted transcript preserves what was actually delivered", () => {
  const h = harness(); h.segment(); h.teacher.interrupt()
  h.teacher.correctResponse({ original_agent_response: "Contribution is selling price minus variable cost.", corrected_agent_response: "Contribution is selling price" })
  assert.equal(h.teacher.state.lastSegment, "Contribution is selling price")
  assert.match(h.teacher.state.unfinishedSegment, /minus variable cost/)
})
