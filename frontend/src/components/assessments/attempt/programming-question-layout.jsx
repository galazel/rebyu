import { useCallback, useEffect, useState } from "react"
import { Code2, FileText, HistoryIcon, Loader2Icon, PlayIcon, TerminalIcon, XIcon } from "@/components/icons"
import { toast } from "sonner"

import { getFileViewUrl } from "@/services/fileService.js"
import {
  getAttemptExecutions,
  runAttemptProgramming,
} from "@/services/assessmentService.js"
import { ProblemStatement, SidePanel, WorkspaceShell } from "./attempt-workspace-shell.jsx"
import CodeMirrorProgrammingWorkspace from "./code-mirror-programming-workspace.jsx"
import ExecutionHistoryPanel from "./execution-history-panel.jsx"
import SubQuestionTabs from "./sub-question-tabs.jsx"

// Programming environment: problem | editor | navigation + runs, as tabs on a
// phone.
//
// Run only runs. It executes the learner's code and shows what the program
// printed -- never whether it passes the item's test cases. Passing and failing
// are for the marker: every test case runs once, when the attempt is submitted.
// Showing a verdict mid-attempt let a learner tune code against the tests until
// they went green instead of answering the question.
//
// `runner` swaps where Run goes. An assessment attempt leaves it unset and the
// attempt endpoint is used; an arena run passes its own { run, listExecutions }.
export default function ProgrammingQuestionLayout({
  question,
  index,
  answer,
  onAnswer,
  attemptId,
  attemptQuestionId,
  learnerId,
  navigator,
  runner = null,
  editingLocked = false,
}) {
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [executions, setExecutions] = useState([])
  const [executionsLoading, setExecutionsLoading] = useState(false)

  const language = answer?.programmingLanguage ?? "Java"
  // The editor starts blank — starter code is never auto-filled. "Reset
  // Code" (in CodeMirrorProgrammingWorkspace) remains available as an
  // explicit, learner-initiated action when starter code exists.
  const code = answer?.submittedCode ?? ""
  const subQuestions = question.subQuestions ?? []

  useEffect(() => {
    setOutput(null)
  }, [question.attemptQuestionId])

  const refreshExecutions = useCallback(() => {
    setExecutionsLoading(true)
    const load = runner
      ? Promise.resolve(runner.listExecutions?.() ?? [])
      : getAttemptExecutions(attemptId, attemptQuestionId, learnerId)

    load
      .then((rows) => setExecutions(Array.isArray(rows) ? rows : []))
      .catch(() => {})
      .finally(() => setExecutionsLoading(false))
  }, [runner, attemptId, attemptQuestionId, learnerId])

  useEffect(() => {
    refreshExecutions()
  }, [refreshExecutions])

  const execute = async () => {
    setRunning(true)
    try {
      const result = runner
        ? await runner.run(code, language)
        : await runAttemptProgramming(attemptId, attemptQuestionId, learnerId, code, language)
      setOutput({
        stdout: result.stdout ?? null,
        stderr: result.stderr ?? null,
        // Only shown when the program printed nothing and raised nothing --
        // e.g. the runner being unavailable.
        message: result.message ?? null,
      })
      refreshExecutions()
    } catch (error) {
      toast.error(error?.response?.data?.message ?? "Unable to run your code right now.")
    } finally {
      setRunning(false)
    }
  }

  const runKey = (
    <button
      type="button"
      onClick={execute}
      disabled={running || editingLocked}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-rb-feather px-3 text-xs font-extrabold text-white shadow-[0_2px_0_var(--color-rb-feather-lip)] transition hover:bg-rb-feather-lip active:translate-y-[2px] active:shadow-none disabled:opacity-60"
    >
      {running ? (
        <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <PlayIcon className="size-3.5" aria-hidden="true" />
      )}
      {running ? "Running" : "Run"}
    </button>
  )

  const problem = (
    <ProblemStatement
      question={question}
      index={index}
      typeLabel="Programming"
      imageSrc={question.questionImageKey ? getFileViewUrl(question.questionImageKey) : null}
    >
      {subQuestions.length > 0 ? (
        <div className="rounded-xl border border-rb-swan bg-rb-polar/40 p-3">
          <SubQuestionTabs
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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1">
        <CodeMirrorProgrammingWorkspace
          value={code}
          language={language}
          starterCode={question.starterCode ?? ""}
          readOnly={editingLocked}
          onChange={(next) => onAnswer({ submittedCode: next })}
          onLanguageChange={(next) => onAnswer({ programmingLanguage: next })}
          actions={runKey}
        />
      </div>

      {/* What the program printed, verbatim, then any compile or runtime error
          in red -- on a chalkboard, like everything the classroom writes back. */}
      {output ? (
        <div className="shrink-0 overflow-hidden rounded-2xl bg-[#22302a] text-[#e6eee8] shadow-inner">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white/70">
              <TerminalIcon className="size-3.5" aria-hidden="true" />
              Output
            </span>
            <button
              type="button"
              onClick={() => setOutput(null)}
              aria-label="Close output"
              className="grid size-6 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
            >
              <XIcon className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-56 overflow-auto px-3 py-2.5 font-mono text-xs leading-5">
            {output.stdout ? <pre className="whitespace-pre-wrap">{output.stdout}</pre> : null}
            {output.stderr ? (
              <pre className="mt-1 whitespace-pre-wrap text-[#ff9d92]">{output.stderr}</pre>
            ) : null}
            {!output.stdout && !output.stderr ? (
              <pre className="whitespace-pre-wrap text-white/60">
                {output.message ?? "(your program printed nothing)"}
              </pre>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )

  const side = (
    <>
      {/* The item grid is in the header's menu on a phone already. */}
      <SidePanel className="hidden lg:block">{navigator}</SidePanel>

      <SidePanel title="Your runs" icon={HistoryIcon}>
        <p className="mb-3 text-xs leading-5 text-rb-wolf">
          Run shows what your program prints. It is checked against the test
          cases when you submit.
        </p>
        <ExecutionHistoryPanel executions={executions} loading={executionsLoading} />
      </SidePanel>
    </>
  )

  return (
    <WorkspaceShell
      tabs={[
        { id: "problem", label: "Problem", icon: FileText },
        { id: "workspace", label: "Code", icon: Code2 },
        { id: "side", label: "Runs", icon: HistoryIcon },
      ]}
      problem={problem}
      workspace={workspace}
      side={side}
    />
  )
}
