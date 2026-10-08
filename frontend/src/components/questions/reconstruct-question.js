import {
  getDiagramQuestionConfig,
  getProgrammingQuestionConfig,
  getTextQuestionConfig,
} from "@/services/assessmentService.js"

export async function reconstructQuestionData(question, allQuestions) {
  const difficulty = question.difficultyLevel ?? "average"
  const questionText = question.questionText ?? ""
  const imageKey = question.imageKey ?? null

  if (question.questionType === "MCQ") {
    const choices = (question.choices ?? []).map((choice) => ({
      choiceText: choice.choiceText ?? "",
      image: null,
      imageKey: choice.imageKey ?? null,
      explanation: choice.explanation ?? "",
      isCorrect: Boolean(choice.correct),
    }))
    const correctChoiceIndex = choices.findIndex((choice) => choice.isCorrect)
    return {
      typeId: "MCQ",
      data: {
        questionType: "MCQ",
        question: questionText,
        image: null,
        imageKey,
        choices,
        correctChoiceIndex: correctChoiceIndex === -1 ? null : correctChoiceIndex,
        difficulty,
      },
    }
  }

  if (question.questionType === "SHORT_ANSWER") {
    const config = await getTextQuestionConfig(question.questionId).catch(() => null)
    return {
      typeId: "SHORT_ANSWER",
      data: {
        questionType: "SHORT_ANSWER",
        question: questionText,
        image: null,
        imageKey,
        correctAnswer: config?.correctAnswer ?? "",
        checkingMethod: config?.checkingMethod ?? "EXACT_MATCH",
        difficulty,
      },
    }
  }

  if (question.questionType === "DESCRIPTIVE") {
    const config = await getTextQuestionConfig(question.questionId).catch(() => null)
    return {
      typeId: "DESCRIPTIVE",
      data: {
        questionType: "DESCRIPTIVE",
        question: questionText,
        image: null,
        imageKey,
        rubricBasedAnswer: config?.correctAnswer ?? "",
        checkingMethod: config?.checkingMethod ?? "AI_SEMANTIC",
        difficulty,
      },
    }
  }

  if (question.questionType === "CRITICAL_THINKING") {
    const subQuestions = allQuestions
      .filter((candidate) => candidate.parentQuestionId === question.questionId)
      .sort((a, b) => (a.questionId ?? 0) - (b.questionId ?? 0))

    const subQuestionData = []
    for (const sub of subQuestions) {
      const subConfig = await getTextQuestionConfig(sub.questionId).catch(() => null)
      subQuestionData.push({
        question: sub.questionText ?? "",
        correctAnswer: subConfig?.correctAnswer ?? "",
      })
    }

    const programmingConfig =
      question.criticalThinkingType === "DIAGRAM"
        ? null
        : await getProgrammingQuestionConfig(question.questionId).catch(() => null)
    if (programmingConfig) {
      return {
        typeId: "PROGRAMMING",
        data: {
          questionType: "CRITICAL_THINKING",
          criticalThinkingType: "PROGRAMMING",
          question: questionText,
          image: null,
          imageKey,
          starterCode: programmingConfig.starterCode ?? "",
          testCases: (programmingConfig.testCases ?? []).map((testCase) => ({
            inputData: testCase.inputData ?? "",
            expectedOutput: testCase.expectedOutput ?? "",
          })),
          subQuestions: subQuestionData,
          difficulty,
        },
      }
    }

    const diagramConfig = await getDiagramQuestionConfig(question.questionId).catch(() => null)
    if (diagramConfig) {
      let nodes = []
      let edges = []
      try {
        const parsed = JSON.parse(diagramConfig.referenceDiagramJson ?? "{}")
        nodes = parsed.nodes ?? []
        edges = parsed.edges ?? []
      } catch {
      }
      return {
        typeId: "DIAGRAM",
        data: {
          questionType: "CRITICAL_THINKING",
          criticalThinkingType: "DIAGRAM",
          question: questionText,
          image: null,
          imageKey,
          diagramType: diagramConfig.diagramType ?? "ERD",
          instructions: diagramConfig.instructions ?? "",
          referenceDiagramXml: diagramConfig.referenceDiagramXml ?? "",
          referenceDiagramNodes: nodes,
          referenceDiagramEdges: edges,
          subQuestions: subQuestionData,
          difficulty,
        },
      }
    }
  }

  return null
}
