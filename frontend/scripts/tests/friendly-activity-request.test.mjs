import assert from 'node:assert/strict'
import { friendlyActivityRequest } from '../../src/lib/friendly-activity-request.js'
assert.equal(friendlyActivityRequest('Create a branching story based on this lesson using show_branching_story.'),'Create a branching story based on this lesson.')
assert.equal(friendlyActivityRequest('Create a crossword puzzle based on this lesson using show_word_game with variant crossword.'),'Create a crossword puzzle based on this lesson.')
assert.equal(friendlyActivityRequest('Create a flashcard speed round based on this lesson using show_speed_flashcards with 15 seconds per card.'),'Create a flashcard speed round based on this lesson with 15 seconds per card.')
assert.equal(friendlyActivityRequest('Explain how using show_branching_story works.'),'Explain how using show_branching_story works.')
assert.equal(friendlyActivityRequest('Create a branching story based on this lesson.'),'Create a branching story based on this lesson.')
console.log('PASS: old activity requests display naturally; ordinary user messages and stored content remain unchanged.')
