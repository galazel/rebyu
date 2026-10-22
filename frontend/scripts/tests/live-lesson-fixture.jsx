import React from "react"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"
import { LessonTool } from "../../src/components/certifications/lesson-content-renderer.jsx"
import { createLessonActions } from "../../src/lib/live-lesson-actions.js"
import { LiveTeachingController } from "../../src/lib/live-teaching-controller.js"
import { Conversation } from "@elevenlabs/client"
import "../../src/index.css"

function Fixture() {
  return <main id="lesson-fixture" className="rebyu-ds p-8">
    <section data-live-section-id="contribution" data-live-title="Contribution per unit">
      <h2>Contribution per unit</h2>
      <LessonTool tool={{ id: "tabs", type: "tabs", data: { items: [{ id: "definition", label: "Definition", description: "Selling price minus variable cost." }, { id: "example", label: "Worked example", description: "One hundred minus sixty leaves forty." }] } }} />
      <LessonTool tool={{ id: "accordion", type: "accordion", data: { items: [{ id: "fixed", title: "Fixed costs", content: "Rent stays fixed." }, { id: "variable", title: "Variable costs", content: "Materials vary with output." }] } }} />
      <LessonTool tool={{ id: "cards", type: "flip-grid", data: { cards: [{ id: "formula", frontTitle: "Contribution formula", description: "Selling price minus variable cost." }] } }} />
    </section>
    <section style={{ marginTop: "100vh" }} data-live-section-id="break-even" data-live-title="Break-even">
      <h2>Break-even</h2><LessonTool tool={{ id: "explanation", type: "description", data: { text: "Fixed costs divided by contribution per unit." } }} />
    </section>
  </main>
}
flushSync(() => createRoot(document.getElementById("root")).render(<Fixture />))
requestAnimationFrame(() => requestAnimationFrame(() => {
  const actions = createLessonActions(document.getElementById("lesson-fixture"))
  window.liveHarness = { ...actions, messages: [], requests: [], results: [], phases: [] }
  window.liveHarness.startProvider = async (signedUrl) => {
    let conversation
    const controller = new LiveTeachingController({ request: (text) => {
      window.liveHarness.requests.push(text)
      conversation.sendUserMessage(`[Teaching controller] ${text}`)
    }, notify: ({ phase }) => window.liveHarness.phases.push(phase) })
    controller.start()
    conversation = await Conversation.startSession({ signedUrl, textOnly: true,
      dynamicVariables: {
        lesson_name: "Contribution and break-even", lesson_id: "integration-test", teaching_checkpoint: "{}",
        opening_message: "Hi! Today we're exploring contribution and break-even. What do you already know about these ideas?",
        lesson_content: JSON.stringify({ objectives: ["Explain contribution per unit", "Apply break-even quantity"], content: "Contribution per unit is selling price minus variable cost. A product sold for 100 with a variable cost of 60 contributes 40 per unit to fixed costs, then profit. Break-even quantity is fixed costs divided by contribution per unit. With fixed costs 400 and contribution 40, ten units break even. Fixed costs like rent stay the same as output changes; variable costs like materials change with output." }),
        lesson_controls: JSON.stringify(actions.catalog()),
      },
      clientTools: {
        teaching_step: (step) => { window.liveHarness.results.push({ tool: "teaching_step", step }); return JSON.stringify(controller.structuredStep(step)) },
        lesson_catalog: () => JSON.stringify({ elements: actions.catalog() }),
        lesson_action: async (request) => { const result = await actions.execute(request); window.liveHarness.results.push({ tool: "lesson_action", request, result }); return JSON.stringify(result) },
      },
      onMessage: ({ role, message }) => {
        if (role !== "agent" && message.startsWith("[Teaching controller]")) return
        window.liveHarness.messages.push({ role, message })
        if (role === "agent") controller.agentMessage(message, { textOnly: true })
        else controller.studentMessage(message)
      },
      onError: (message) => { window.liveHarness.error = String(message); controller.dispose() },
    })
    window.liveHarness.answer = (text) => { controller.studentMessage(text); conversation.sendUserMessage(text) }
    window.liveHarness.stop = async () => { controller.dispose(); await conversation.endSession() }
  }
}))
