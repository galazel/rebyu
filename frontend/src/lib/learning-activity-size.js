export const ACTIVITY_ITEM_UNITS = {
  quiz: 'questions', true_false: 'statements', sorting: 'items', ordering: 'steps',
  fill_blank: 'blanks', crossword: 'words', hangman: 'words', unscramble: 'words',
  matching: 'pairs', branching_story: 'decision points', simulation: 'rounds',
  two_truths_lie: 'rounds', flashcards: 'flashcards', speed_flashcards: 'flashcards',
}

export function activityRequest(tool, count = 10) {
  if (!Number.isInteger(count) || count < 10 || count > 20) throw new RangeError('Choose 10 to 20 items.')
  return `${tool.prompt} Include exactly ${count} ${ACTIVITY_ITEM_UNITS[tool.id] || 'items'}.`
}
