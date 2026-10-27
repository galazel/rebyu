import { useRef } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LiveTutor } from "../../src/components/learner/live-tutor.jsx"
import { LessonTool } from "../../src/components/certifications/lesson-content-renderer.jsx"
function Fixture() {
  const root = useRef(null)
  return <><main ref={root}><section data-live-section-id="intro" data-live-title="Introduction">Lesson introduction<LessonTool tool={{ id: "costs", type: "accordion", data: { items: [{ id: "fixed", title: "Fixed costs", content: "Rent stays fixed." }] } }} /></section></main><LiveTutor lessonId={1} lessonName="Fixture lesson" lessonRootRef={root} onExit={() => {}} /></>
}
createRoot(document.getElementById("root")).render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Fixture /></QueryClientProvider>)
