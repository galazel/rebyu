const string = (description, values) => ({ type: "string", description, ...(values ? { enum: values } : {}) })
const clientTool = (name, description, properties, required) => ({ type: "client", name, description, expectsResponse: true, responseTimeoutSecs: 8, interruptionMode: "allow", preToolSpeech: "off", parameters: { type: "object", properties, required } })
export const LIVE_TEACHING_TOOLS = [
  clientTool("teaching_step", "REQUIRED before each spoken teaching segment. Tell the teaching controller whether the upcoming segment explains/demonstrates/feeds back, asks a real diagnostic/question/recitation, summarizes, or completes the lesson. Explain/feedback continues automatically after playback. Diagnostic/question/recitation opens a response window. Never report complete until the closing summary and oral recitation have finished.", {
    kind: string("The type of the upcoming segment.", ["diagnostic", "explain", "demonstrate", "question", "feedback", "recitation", "summary", "complete"]),
    concept: string("The concise current learning objective or concept."),
    sectionId: string("Current section ID from the lesson catalog, without the section: prefix."),
    questionKey: string("Stable ID for a real question; reuse it for a hint/retry of the same question."),
    completedConcept: string("Only a previously explained concept; omit when none is newly finished. Not a mastery score."),
  }, ["kind", "concept"]),
  clientTool("lesson_catalog", "Get the actual lesson sections, cards, accordion controls, tabs, tools, and images with their exact IDs. Use those IDs in lesson_action. Refresh if the page changes or an action fails.", {}, []),
  clientTool("lesson_action", "Operate only an existing element in this lesson. Navigate to the relevant section before teaching it; open a relevant accordion/tab/card BEFORE explaining its detail. Returns confirmed UI state/text. Images return metadata, not pixels. Never claim an action succeeded unless ok=true. Respect a manualExploration result and do not repeatedly retry failed actions.", {
    action: string("Supported operation.", ["scroll_to_section", "open_tab", "expand_accordion", "collapse_accordion", "reveal_card", "show_card_front", "select_lesson_image", "open_lesson_tool", "highlight_element"]),
    targetId: string("Exact ID from lesson_catalog or lesson_controls. Do not invent an ID or a CSS selector."),
  }, ["action", "targetId"]),
]
