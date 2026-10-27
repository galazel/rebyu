import test from "node:test"
import assert from "node:assert/strict"
import { LiveTurnCoordinator } from "../../src/lib/live-turn-coordinator.js"

test("graph activity, submission and continuation are serialized", async () => {
  const seen = []
  const coordinator = new LiveTurnCoordinator({ sessionId: "lesson", connectionId: "connection", request: async (event) => { seen.push(event); return { allowContinue: event.action === "continue" } } })
  await Promise.all([coordinator.event("typing", { active: true }), coordinator.event("submit", { message: "My answer" }), coordinator.event("continue")])
  assert.deepEqual(seen.map((event) => event.action), ["typing", "submit", "continue"])
  assert.deepEqual(seen.map((event) => event.sequence), [1, 2, 3])
  assert.equal(seen[0].message, undefined)
})

test("coordinator rejects accidental draft transmission", () => {
  const coordinator = new LiveTurnCoordinator({ connectionId: "connection", request: () => assert.fail("must not send") })
  assert.throws(() => coordinator.event("typing", { active: true, message: "private draft" }), /private/)
})

test("failed coordination rejects the operation but a later retry can recover", async () => {
  let count = 0
  const coordinator = new LiveTurnCoordinator({ connectionId: "connection", request: async () => { if (++count === 1) throw new Error("offline"); return { phase: "EVALUATING_ANSWER" } } })
  await assert.rejects(coordinator.event("submit", { message: "Answer" }), /offline/)
  assert.equal((await coordinator.event("submit", { message: "Answer" })).phase, "EVALUATING_ANSWER")
})
