// Mirrors AssessmentAttemptService.REFERS_TO_OTHER_CHOICES: retakes shuffle the
// choices, except in a question where one choice names another by position.
const REFERS_TO_OTHER_CHOICES = new RegExp(
  [
    String.raw`\b(all|none|both|neither) of (the )?(above|these|the (above|choices|options))\b`,
    String.raw`^\s*(both|only|neither)?\s*\(?[a-d]\)?\s*(and|&|or)\s*\(?[a-d]\)?\s*(only)?\.?\s*$`,
    String.raw`\b(options?|choices?) [a-d]\b`,
  ].join("|"),
  "i",
)

export function choiceRefersToOthers(text) {
  return REFERS_TO_OTHER_CHOICES.test(String(text ?? "").trim())
}

export function choicesCanShuffle(choices) {
  return !(choices ?? []).some((choice) => choiceRefersToOthers(choice?.choiceText))
}
