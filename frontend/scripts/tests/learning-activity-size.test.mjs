import assert from 'node:assert/strict'
import { ACTIVITY_ITEM_UNITS, activityRequest } from '../../src/lib/learning-activity-size.js'
for (const [id, unit] of Object.entries(ACTIVITY_ITEM_UNITS)) {
  const tool = { id, prompt: 'Create an activity based on this lesson.' }
  assert.match(activityRequest(tool), new RegExp(`exactly 10 ${unit}`))
  assert.match(activityRequest(tool,20), new RegExp(`exactly 20 ${unit}`))
  for (const invalid of [0,9,21,10.5]) assert.throws(()=>activityRequest(tool,invalid),RangeError)
}
assert.equal(activityRequest({id:'speed_flashcards',prompt:'Create a flashcard speed round with 15 seconds per card.'},20),'Create a flashcard speed round with 15 seconds per card. Include exactly 20 flashcards.')
console.log('PASS: all 14 picker activities default to 10, allow 20, reject out-of-range sizes and preserve timer duration.')
