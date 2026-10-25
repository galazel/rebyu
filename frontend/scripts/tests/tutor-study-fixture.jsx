import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { GeminiTutorMessage } from "../../src/components/learner/lesson-ai-tutor.jsx"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"
const widgets = [{ type: "quiz", title: "OR and IE — practice", library: { id: 42, route: "/learner/assessments/513" }, questions: [
  { question: "What is contribution per unit when the selling price is 500 and variable cost is 300?", options: ["100", "150", "200", "250"], correctIndex: 2, explanation: "Contribution = selling price − variable cost = 200." },
  { question: "What is the break-even volume with fixed cost 400,000 and contribution 200?", options: ["1,500 units", "2,000 units", "2,500 units", "3,000 units"], correctIndex: 1, explanation: "400,000 ÷ 200 = 2,000 units." },
]}]
createRoot(document.getElementById("root")).render(<BrowserRouter><main className="rebyu-ds netacad-portal min-h-screen bg-background p-4 text-foreground"><div className="mx-auto max-w-2xl"><GeminiTutorMessage message={{role:'user',text:'Create a quiz based on this lesson.'}} isFirstInGroup isLastInGroup /><GeminiTutorMessage message={{role:'assistant',widgets}} isFirstInGroup isLastInGroup persistenceScope="learner9:lesson246:study-browser" /></div></main></BrowserRouter>)
