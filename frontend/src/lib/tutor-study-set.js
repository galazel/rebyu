/** Both views use the original saved content; changing views never generates a new set. */
export function tutorStudyItems(data) {
  if (data.type === "quiz") {
    return (Array.isArray(data.questions) ? data.questions : []).map((question) => ({
      front: question.question,
      back: question.options?.[question.correctIndex] ?? "",
      options: question.options ?? [],
      correctIndex: question.correctIndex,
      explanation: question.explanation || "",
    }))
  }
  const cards = Array.isArray(data.cards) ? data.cards : []
  return cards.map((card, index) => {
    // Other cards' answers provide deterministic distractors without inventing new facts.
    const alternatives = [...new Set(cards.filter((_, other) => other !== index).map((other) => other.back).filter((back) => back && back !== card.back))].slice(0, 3)
    const options = [...alternatives]
    const correctIndex = index % (options.length + 1)
    options.splice(correctIndex, 0, card.back)
    return { front: card.front, back: card.back, options: alternatives.length ? options : [], correctIndex, explanation: card.explanation || "" }
  })
}

export function studyIndex(value, total) {
  return Number.isInteger(value) ? Math.max(0, Math.min(value, Math.max(0, total - 1))) : 0
}
