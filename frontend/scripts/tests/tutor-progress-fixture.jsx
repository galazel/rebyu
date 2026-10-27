import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { TutorWidgets } from "../../src/components/learner/tutor-widgets.jsx"
const widgets = [
  { type: "quiz", title: "Quiz", hint: "Remember costs", questions: [{ question: "Contribution?", options: ["Price minus cost", "Rent"], correctIndex: 0, explanation: "Subtract variable cost." }] },
  { type: "flashcards", cards: [{ front: "First card", back: "First answer" }, { front: "Second card", back: "Second answer" }] },
  { type: "matching", pairs: [{ term: "Fixed", match: "Rent" }, { term: "Variable", match: "Materials" }] },
  { type: "ordering", items: ["First", "Second", "Third"] },
  { type: "fill_blank", blanks: [{ sentence: "Fixed cost is ___", answer: "rent" }] },
  { type: "true_false", claims: [{ claim: "Rent is fixed", isTrue: true, explanation: "Yes." }] },
  { type: "steps", problem: "Add", steps: [{ title: "First step", detail: "One" }, { title: "Second step", detail: "Two" }], answer: "Three" },
  { type: "explorer", variables: [{ name: "price", label: "Price", value: 10, min: 1, max: 100, step: 1 }], outputs: [{ label: "Total", formula: "price * 2" }] },
  { type: "mindmap", center: "Costs", branches: [{ label: "Fixed", children: [{ label: "Rent", note: "Fixed cost" }] }] },
]
const scope = new URLSearchParams(location.search).get("scope") || "learner9:lesson246:chat1:activity0"
createRoot(document.getElementById("root")).render(<BrowserRouter><TutorWidgets widgets={widgets} persistenceScope={scope} /></BrowserRouter>)
