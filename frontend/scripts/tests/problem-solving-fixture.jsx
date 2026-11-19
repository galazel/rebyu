import { useState } from "react"
import { createRoot } from "react-dom/client"
import {
  EquationAnswerInput,
  ProblemSolvingAnswerView,
} from "../../src/components/assessments/attempt/equation-answer-input.jsx"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"

const SUBMITTED =
  "\\(V = I \\times R\\)\n\\(V = \\pu{3 A} \\times \\pu{4 \\Omega}\\)\n\nFinal answer: \\(\\pu{12 V}\\)"

function Harness() {
  const [value, setValue] = useState("")

  // The test reads this to prove the two fields are encoded into the one
  // `learnerAnswer` string the attempt API actually carries.
  window.__answer = value

  return (
    <div className="netacad-portal rebyu-ds learner-portal">
      <main className="rebyu-page mx-auto max-w-3xl space-y-8 px-4 py-8" data-route-content>
        <section aria-label="Answering">
          <EquationAnswerInput
            value={value}
            onChange={(next) => {
              window.__answer = next
              setValue(next)
            }}
          />
        </section>

        <section aria-label="Submitted" data-submitted>
          <ProblemSolvingAnswerView value={SUBMITTED} />
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById("root")).render(<Harness />)
