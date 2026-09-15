import { useEffect, useState } from "react"

import { ClipboardCheck, FileText, Workflow } from "@/components/icons"
import { cn } from "@/lib/utils"
import { getFileViewUrl } from "@/services/fileService.js"
import DiagramArea from "@/components/challenges/diagram-area.jsx"
import { getDiagramTypeLabel } from "@/components/questions/question-editors.jsx"
import { ProblemStatement, SidePanel, WorkspaceShell } from "./attempt-workspace-shell.jsx"
import RubricPanel from "./rubric-panel.jsx"
import SubQuestionTabs from "./sub-question-tabs.jsx"

// Diagram environment: problem | canvas | navigation + rubric, as tabs on a
// phone. There is no in-attempt Check: grading compares against
// `reference_diagram_xml`, and whether a learner should get that verdict
// mid-attempt is a product call, not a technical blocker.
//
// `checker`, `attemptId`, `attemptQuestionId` and `learnerId` stay on the
// signature though nothing reads them now: they are what a restored Check would
// need, and callers already pass them.
export default function DiagramQuestionLayout({
  question,
  index,
  answer,
  onAnswer,
  attemptId,
  attemptQuestionId,
  learnerId,
  navigator,
  checker = null,
  editingLocked = false,
}) {
  const [rubric, setRubric] = useState(question.rubric ?? [])
  const [notice, setNotice] = useState(null)

  const diagramType = question.diagramType ?? "ERD"
  const diagramLabel = getDiagramTypeLabel(diagramType)
  const subQuestions = question.subQuestions ?? []

  // This layout is deliberately NOT remounted per question: remounting would
  // tear down the draw.io iframe and re-download the editor on every step
  // through a diagram exam. Everything question-scoped resets here instead.
  useEffect(() => {
    setRubric(question.rubric ?? [])
    setNotice(null)
  }, [question.attemptQuestionId, question.rubric])

  const problem = (
    <ProblemStatement
      question={question}
      index={index}
      typeLabel={`Diagram · ${diagramLabel}`}
      imageSrc={question.questionImageKey ? getFileViewUrl(question.questionImageKey) : null}
    >
      {subQuestions.length > 0 ? (
        <div className="rounded-xl border border-rb-swan bg-rb-polar/40 p-3">
          <SubQuestionTabs
            key={question.attemptQuestionId ?? question.questionId ?? index}
            subQuestions={subQuestions.map((sub) => ({
              questionId: sub.subQuestionId,
              questionText: sub.questionText,
            }))}
            answers={answer?.subAnswers ?? {}}
            readOnly={editingLocked}
            onAnswerChange={(subQuestionId, text) =>
              onAnswer({ subAnswers: { ...(answer?.subAnswers ?? {}), [subQuestionId]: text } })
            }
          />
        </div>
      ) : null}
    </ProblemStatement>
  )

  const workspace = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-rb-swan bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rb-swan bg-rb-polar/60 px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-extrabold text-rb-eel">
          <Workflow className="size-4 shrink-0 text-rb-feather" aria-hidden="true" />
          <span className="truncate">{diagramLabel} canvas</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-rb-hare">
          <span className="size-1.5 rounded-full bg-rb-feather" aria-hidden="true" />
          {editingLocked ? "Locked" : "Saves automatically"}
        </span>
      </div>

      <div className={cn("min-h-[360px] flex-1 lg:min-h-0", editingLocked && "pointer-events-none opacity-70")}>
        <DiagramArea
          diagramType={diagramType}
          documentId={question.attemptQuestionId ?? question.questionId ?? index}
          initialXml={answer?.diagramSubmissionData}
          onChange={(diagramXml) => onAnswer({ diagramSubmissionData: diagramXml })}
        />
      </div>
    </div>
  )

  const side = (
    <>
      {/* The item grid is in the header's menu on a phone already. */}
      <SidePanel className="hidden lg:block">{navigator}</SidePanel>

      {/* RubricPanel draws its own "Rubric · N pts total" heading. */}
      <SidePanel>
        <RubricPanel rubric={rubric} notice={notice} />
      </SidePanel>
    </>
  )

  return (
    <WorkspaceShell
      tabs={[
        { id: "problem", label: "Problem", icon: FileText },
        { id: "workspace", label: "Diagram", icon: Workflow },
        { id: "side", label: "Rubric", icon: ClipboardCheck },
      ]}
      problem={problem}
      workspace={workspace}
      side={side}
    />
  )
}
