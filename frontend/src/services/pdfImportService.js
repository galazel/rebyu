import { base } from "./base"

/**
 * A lesson and a difficulty for each question text, from the tagging model
 * (Grok on OpenRouter, free models as fallbacks). Resolves to
 * `{ tags: [{ lessonId, lessonName, difficulty, source, score }],
 *    lessons: [{ lessonId, name, category }] }`, tags in question order.
 * Nothing is written.
 */
export function tagQuestions(certificationId, questions) {
    return base("ai/past-papers/tag", {
        method: "POST",
        data: { certificationId: Number(certificationId), questions },
        timeout: 240000,
    })
}
