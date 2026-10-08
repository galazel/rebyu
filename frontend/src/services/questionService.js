import { base } from "./base"

export const DEFAULT_GENERATION_TARGET = 100

export async function saveQuestion(question, ownerDepartmentId) {
    const query = ownerDepartmentId != null ? `?ownerDepartmentId=${ownerDepartmentId}` : ""
    return await base(`questions${query}`, {
        method: "POST",
        data: question,
    })
}

export async function updateQuestion(questionId, question) {
    return await base(`questions/${questionId}`, {
        method: "PUT",
        data: question,
    })
}

export async function deleteQuestion(questionId) {
    return await base(`questions/${questionId}`, {
        method: "DELETE",
    })
}

export async function getQuestionsByLesson(lessonId, includeDepartmentId) {
    const group = includeDepartmentId != null ? `&includeDepartmentId=${includeDepartmentId}` : ""
    return await base(`questions?lessonId=${lessonId}${group}`, {
        method: "GET",
    })
}

export async function getQuestions(includeDepartmentId, certificationId) {
    const params = new URLSearchParams()
    if (includeDepartmentId != null) params.set("includeDepartmentId", includeDepartmentId)
    if (certificationId != null) params.set("certificationId", certificationId)
    const query = params.toString()
    return await base(`questions${query ? `?${query}` : ""}`, {
        method: "GET",
    })
}

export async function getEligibleQuestions({
    certificationId,
    majorId,
    middleId,
    lessonId,
    examId,
    includeDepartmentId,
} = {}) {
    const params = new URLSearchParams()
    if (certificationId != null) params.set("certificationId", certificationId)
    if (majorId != null) params.set("majorId", majorId)
    if (middleId != null) params.set("middleId", middleId)
    if (lessonId != null) params.set("lessonId", lessonId)
    if (examId != null) params.set("examId", examId)
    if (includeDepartmentId != null) params.set("includeDepartmentId", includeDepartmentId)
    return await base(`questions/eligible?${params.toString()}`, { method: "GET" })
}

export async function generateQuestionsFromFiles(
    certificationId,
    files,
    questionCounts,
    options = {}
) {
    const formData = new FormData()

    formData.append("certificationId", String(certificationId))

    if (questionCounts && typeof questionCounts === "object") {
        formData.append("questionCountsJson", JSON.stringify(questionCounts))
    }
    if (options.sourceMode) {
        formData.append("sourceMode", options.sourceMode)
    }
    if (options.targetQuestionCount) {
        formData.append(
            "targetQuestionCount",
            String(options.targetQuestionCount)
        )
    }
    if (options.additionalInstructions) {
        formData.append(
            "additionalInstructions",
            options.additionalInstructions
        )
    }

    ;(files ?? []).forEach((file) => {
        formData.append("files", file)
    })

    return await base("ai/questions/generate", {
        method: "POST",
        data: formData,
    })
}

export function generateQuestionDrafts({
    certificationId,
    sourceMode,
    files = [],
    targetQuestionCount,
    additionalInstructions,
}) {
    return generateQuestionsFromFiles(certificationId, files, null, {
        sourceMode,
        targetQuestionCount,
        additionalInstructions,
    })
}

export async function saveChoices(choices) {
    return await base("choices", {
        method: "POST",
        data: choices,
    })
}

export async function saveTextQuestion(textQuestion) {
    return await base("text-question-configs", {
        method: "POST",
        data: textQuestion,
    })
}

export async function saveDiagramQuestion(diagramQuestion) {
    return await base("diagram-question-configs", {
        method: "POST",
        data: diagramQuestion,
    })
}

export async function saveProgrammingQuestion(programmingQuestion) {
    return await base("programming-question-configs", {
        method: "POST",
        data: programmingQuestion,
    })
}
