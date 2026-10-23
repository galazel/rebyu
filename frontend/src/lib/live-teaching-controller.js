const KINDS = new Set(["diagnostic", "explain", "demonstrate", "question", "feedback", "recitation", "summary", "complete"])
const STATES = { diagnostic: "DIAGNOSTIC", explain: "TEACHING", demonstrate: "DEMONSTRATING", question: "ASKING_QUESTION", feedback: "EXPLAINING_FEEDBACK", recitation: "ORAL_EXAM", summary: "TRANSITIONING", complete: "COMPLETED" }
export function cleanSpeechText(text = "") {
  return text.replace(/\[(?:calm|happy|gentle|excited|sad|thoughtful|warm|curious|reassuring|encouraging|laughs|chuckles|sighs)\]/gi, "").replace(/ {2,}/g, " ").trim()
}

// Audio transport stays in ElevenLabs. This controller owns what happens AFTER a turn.
export class LiveTeachingController {
  constructor({ request, persist = () => {}, notify = () => {}, schedule = (callback, delay) => setTimeout(callback, delay), cancel = (id) => clearTimeout(id), now = Date.now, responseWindowMs = 20000, hintWindowMs = 15000, continueDelayMs = 1600 }) {
    Object.assign(this, { request, persist, notify, schedule, cancel, now, responseWindowMs, hintWindowMs, continueDelayMs })
    this.state = { phase: "INITIALIZING", kind: "diagnostic", concept: "", sectionId: "", questionKey: "opening", silenceAttempts: 0, completedConcepts: [], recentEvents: [] }
    this.timer = null
    this.active = false
    this.speaking = false
    this.studentSpeaking = false
    this.studentTyping = false
    this.pending = false
    this.hasAgentResponse = false
    this.epoch = 0
    this.requestId = 0
  }
  record(event) {
    this.state.recentEvents = [...this.state.recentEvents, { event, at: this.now() }].slice(-12)
    this.notify({ ...this.state })
    this.persist({ ...this.state })
  }
  clear() { if (this.timer !== null) this.cancel(this.timer); this.timer = null; this.epoch += 1 }
  start(checkpoint) {
    if (checkpoint?.completedConcepts) this.state = { ...this.state, ...checkpoint, recentEvents: [] }
    this.active = true
    this.studentTyping = false
    this.state.phase = "GREETING"
    this.pending = true
    this.record("session_started")
  }
  plan(step) {
    if (!this.active) return { ok: false, error: "This teaching controller is not active." }
    if (!step || !KINDS.has(step.kind) || typeof step.concept !== "string" || step.concept.length > 240) return { ok: false, error: "Invalid teaching step." }
    if (this.state.phase === "PAUSED") return { ok: false, error: "The learner explicitly paused. Do not speak or navigate until resumed." }
    if (this.studentTyping) return { ok: false, error: "The learner is composing an unsent response. Wait silently; do not teach, ask another question or navigate until they submit or clear their draft." }
    const questionKey = String(step.questionKey || `${step.sectionId ?? ""}:${step.concept}`).slice(0, 300)
    const sameQuestion = questionKey === this.state.questionKey
    const completed = typeof step.completedConcept === "string" ? step.completedConcept.trim().slice(0, 120) : ""
    const preserveSilence = sameQuestion || (this.recoveringSilence && ["diagnostic", "question", "recitation"].includes(step.kind))
    this.state = { ...this.state, phase: STATES[step.kind], kind: step.kind, concept: step.concept, sectionId: String(step.sectionId ?? "").slice(0, 200), questionKey, silenceAttempts: preserveSilence ? this.state.silenceAttempts : 0,
      completedConcepts: completed ? [...new Set([...this.state.completedConcepts, completed])].slice(-24) : this.state.completedConcepts }
    if (!["diagnostic", "question", "recitation"].includes(step.kind)) this.recoveringSilence = false
    this.clear()
    this.pending = true
    this.hasAgentResponse = false
    this.watchResponse()
    this.record("teaching_step_planned")
    return { ok: true, phase: this.state.phase, instruction: "Deliver this short teaching segment now. The controller schedules continuation or the answer window after playback. Do not ask permission to continue." }
  }
  agentMessage(text, { textOnly = false } = {}) {
    if (!this.active || this.state.phase === "PAUSED") return
    this.requestId += 1
    this.clear()
    this.pending = false
    this.hasAgentResponse = true
    this.state.lastSegment = cleanSpeechText(text).slice(0, 1600)
    // Recovery when the model omits its structured step tool: only explicit questions wait.
    if (!this.plannedThisTurn) {
      this.state.kind = /\?\s*$/.test(this.state.lastSegment) ? (this.state.phase === "GREETING" ? "diagnostic" : "question") : "explain"
    }
    this.plannedThisTurn = false
    this.record("agent_segment_received")
    if (textOnly) this.arm()
  }
  correctResponse({ original_agent_response, corrected_agent_response }) {
    this.state.lastSegment = cleanSpeechText(corrected_agent_response).slice(0, 1600)
    this.state.unfinishedSegment = cleanSpeechText(original_agent_response).slice(this.state.lastSegment.length, this.state.lastSegment.length + 1600)
    this.record("interrupted_segment_corrected")
  }
  structuredStep(step) { const result = this.plan(step); if (result.ok) this.plannedThisTurn = true; return result }
  audio(speaking) {
    this.speaking = speaking
    if (speaking) { this.clear(); this.pending = false }
    else if (this.hasAgentResponse) this.arm()
  }
  speech(active) {
    if (active === this.studentSpeaking || this.state.phase === "PAUSED" || !this.active) return
    this.studentSpeaking = active
    if (active) { this.clear(); this.state.phase = "LISTENING_FOR_ANSWER" }
    else if (this.active && !this.pending) {
      // Leave the provider time to transcribe/process a student's spoken answer.
      this.defer(7000, () => { if (!this.pending) this.arm() })
    }
  }
  studentMessage(text) {
    if (!this.active || this.state.phase === "PAUSED" || !text?.trim()) return
    this.requestId += 1
    this.clear(); this.pending = true; this.studentSpeaking = false; this.hasAgentResponse = false
    this.state.studentQuestion = text.slice(0, 1600)
    this.state.phase = "EVALUATING_ANSWER"; this.state.silenceAttempts = 0
    this.recoveringSilence = false
    this.record("student_turn")
  }
  typing(active) {
    if (active === this.studentTyping) return
    this.studentTyping = Boolean(active)
    this.clear()
    if (!active && this.active && this.state.phase !== "PAUSED") {
      if (this.pending) this.watchResponse()
      else if (this.hasAgentResponse) this.arm()
    }
  }
  interrupt() {
    if (!this.active || this.state.phase === "PAUSED") return
    this.clear(); this.pending = false; this.hasAgentResponse = false
    this.state.phase = "LISTENING_FOR_ANSWER"
    this.state.unfinishedSegment = this.state.lastSegment ?? ""
    this.record("student_interrupted")
  }
  defer(delay, action) {
    this.clear()
    const epoch = this.epoch
    this.timer = this.schedule(() => { this.timer = null; if (epoch === this.epoch && this.active && !this.speaking && !this.studentSpeaking && !this.studentTyping && this.state.phase !== "PAUSED") action() }, delay)
  }
  watchResponse() {
    this.defer(30000, () => { if (this.pending) { this.pending = false; this.active = false; this.state.phase = "ERROR"; this.record("response_timed_out") } })
  }
  arm() {
    if (!this.active || this.speaking || this.studentSpeaking || this.studentTyping || this.pending || this.state.phase === "PAUSED") return
    if (this.state.kind === "complete") { this.active = false; this.state.phase = "COMPLETED"; this.record("lesson_completed"); return }
    if (["diagnostic", "question", "recitation"].includes(this.state.kind)) {
      this.state.phase = "LISTENING_FOR_ANSWER"
      this.record("answer_window_opened")
      this.defer(this.state.silenceAttempts ? this.hintWindowMs : this.responseWindowMs, () => {
        this.state.silenceAttempts += 1
        this.recoveringSilence = true
        if (this.state.silenceAttempts === 1) this.dispatch("No answer arrived in the response window. Give ONE useful hint or simpler version of the current question. Keep the same questionKey in teaching_step and wait once more. Do not say 'still with me', 'take your time', or ask whether to continue.")
        else { this.state.kind = "explain"; this.dispatch("The learner has not answered after the response window and one hint. Do not infer agreement or mastery. Explain a brief model answer, mark this question unanswered, and continue teaching the next relevant idea automatically. Call teaching_step with explain or feedback, not another waiting question.") }
      })
    } else {
      this.state.phase = "TRANSITIONING"
      this.record("continuation_scheduled")
      this.defer(this.continueDelayMs, () => this.dispatch("Continue the teaching plan from the current checkpoint. Select the next useful explanation, demonstration, targeted recitation question, or closing summary. Use teaching_step and lesson_action as needed. Do not repeat the last segment, read all lesson prose, greet again, or ask permission to proceed."))
    }
  }
  dispatch(instruction) {
    if (!this.active || this.pending || this.studentTyping || this.state.phase === "PAUSED") return
    this.pending = true; this.hasAgentResponse = false
    const requestId = ++this.requestId
    this.record("next_action_requested")
    try {
      const result = this.request(instruction)
      if (result?.catch) result.catch(() => {
        if (requestId !== this.requestId || !this.active || this.studentTyping || this.state.phase === "PAUSED") return
        this.clear(); this.pending = false; this.active = false; this.state.phase = "ERROR"; this.record("request_failed")
      })
      this.watchResponse()
    } catch { this.pending = false; this.active = false; this.state.phase = "ERROR"; this.record("request_failed") }
  }
  cancelPending(reschedule = true) {
    this.requestId += 1
    this.clear(); this.pending = false; this.hasAgentResponse = Boolean(this.state.lastSegment)
    if (reschedule) this.arm()
  }
  pause() { this.clear(); if (this.speaking) this.state.unfinishedSegment = this.state.lastSegment ?? ""; this.state.phase = "PAUSED"; this.record("explicit_pause") }
  resume() { this.clear(); this.pending = false; this.speaking = false; this.studentSpeaking = false; this.state.phase = "TEACHING"; this.dispatch("The learner resumed. Continue from the unfinished concept. Do not ask permission or restart the lesson.") }
  stop() { this.clear(); this.active = false; this.record("session_stopped") }
  suspend() {
    if (this.state.phase === "COMPLETED") return
    this.pause()
    this.active = false
    this.record("session_suspended")
  }
  dispose() { this.clear(); this.active = false }
}
