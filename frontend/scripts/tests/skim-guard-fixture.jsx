import { useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { useReadingPaceGuard } from "../../src/hooks/useReadingPaceGuard.js"
import { useSkimChallenge } from "../../src/hooks/useSkimChallenge.js"

function Fixture() {
  const root = useRef(null)
  const [lessonId, setLesson] = useState(1)
  const [enabled, setEnabled] = useState(true)
  const [rushes, setRushes] = useState(0)
  const check = useSkimChallenge({ learnerId: 9, lessonId, enabled })
  useReadingPaceGuard({ enabled, resetKey: lessonId, lessonRootRef: root, onRush: () => { setRushes((n) => n + 1); check.trigger() } })
  window.skimFixture = { setLesson, setEnabled, trigger: check.trigger, offer: check.offer, rushes }
  return <><aside id="chat" style={{ position: "fixed", right: 0, height: 200, overflowY: "auto" }}><div style={{ height: 1000 }}>Tutor chat</div></aside><main ref={root} style={{ height: 12000 }}><p id="lesson-text">Lesson content</p><textarea id="draft" /><div id="nested" style={{ height: 100, overflowY: "auto" }}><div id="nested-text" style={{ height: 1000 }}>Scrollable card</div></div></main></>
}
createRoot(document.getElementById("root")).render(<Fixture />)
