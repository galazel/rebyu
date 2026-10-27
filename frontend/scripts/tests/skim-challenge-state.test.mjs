import test from "node:test"
import assert from "node:assert/strict"
import { countSkimLesson, parseSkimLessons, skimSessionKey } from "../../src/lib/skim-challenge-state.js"

test("only the third distinct skimmed lesson triggers a challenge", () => {
  let result = countSkimLesson([], 246)
  assert.equal(result.challenge, false)
  result = countSkimLesson(result.lessons, 246)
  assert.deepEqual(result, { lessons: [246], challenge: false })
  result = countSkimLesson(result.lessons, 247)
  assert.equal(result.challenge, false)
  result = countSkimLesson(result.lessons, 248)
  assert.deepEqual(result, { lessons: [], challenge: true })
})
test("invalid or duplicated stored IDs cannot inflate the count", () => {
  assert.deepEqual(parseSkimLessons('[246,246,"247",null,"bad",-1,0,1.5]'), [246,247])
  assert.deepEqual(parseSkimLessons('broken'), [])
  assert.deepEqual(countSkimLesson([], null), { lessons: [], challenge: false })
})
test("new session key does not reuse legacy permanent strikes", () => {
  assert.notEqual(skimSessionKey(9), "rebyu:skim-strikes:9")
  assert.notEqual(skimSessionKey(9), skimSessionKey(10))
})
