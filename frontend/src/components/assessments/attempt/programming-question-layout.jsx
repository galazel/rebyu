import { useCallback, useEffect, useState } from "react"
import { Code2, FileText, ListChecks, Loader2Icon, PlayIcon, TerminalIcon, XIcon } from "@/components/icons"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFileViewUrl } from "@/services/fileService.js"
import {
  getAttemptExecutions,
  runAttemptProgramming,
} from "@/services/assessmentService.js"
import { ProblemStatement, SidePanel, WorkspaceShell } from "./attempt-workspace-shell.jsx"
import CodeMirrorProgrammingWorkspace from "./code-mirror-programming-workspace.jsx"
import ExecutionHistoryPanel from "./execution-history-panel.jsx"
import SubQuestionTabs from "./sub-question-tabs.jsx"
import TestCasesPanel from "./test-cases-panel.jsx"

// Programming environment: problem | editor | navigation + tests, as tabs on a
// phone. Run hits real endpoints; the executor is stubbed server-side, so
// results come back as "not run / unavailable" — nothing is fake-scored here.
//
// `runner` swaps where Run goes. An assessment attempt leaves it unset and
// the attempt endpoints are used; an arena run — which has no attempt, no
// attempt question and no learner id to send — passes its own
// { run, check, listExecutions }. The layout is identical either way, which is
// the point: a CodeStrike problem should not be a second, subtly different
// coding environment from the one the learner sits an exam in.
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
  const [tests, setTests] = useState(question.testCases ?? [])
  const [notice, setNotice] = useState(null)
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("tests")
  const [executions, setExecutions] = useState([])
  const [executionsLoading, setExecutionsLoading] = useState(false)

  const language = answer?.programmingLanguage ?? "Java"
  // The editor starts blank — starter code is never auto-filled. "Reset
  // Code" (in CodeMirrorProgrammingWorkspace) remains available as an
  // explicit, learner-initiated action when starter code exists.
  const code = answer?.submittedCode ?? ""
  const subQuestions = question.subQuestions ?? []

  useEffect(() => {
    setTests(question.testCases ?? [])
    setNotice(null)
    setOutput(null)
  }, [question.attemptQuestionId, question.testCases])

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

  // Run only. Check Code was removed: it graded the code against the item's
  // test cases mid-attempt, which is a verdict, and it is the same call the
  // marker makes at submission.
  const execute = async () => {
    setRunning(true)
    try {
      const result = runner
        ? await runner.run(code, language)
        : await runAttemptProgramming(attemptId, attemptQuestionId, learnerId, code, language)
      setTests(result.tests ?? [])
      setNotice(result.message ?? null)
      setOutput(result.message ?? "Finished with no output.")
      setActiveTab("tests")
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

      {/* Output reads off a chalkboard, like everything the classroom writes back. */}
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
          <pre className="max-h-36 overflow-auto whitespace-pre-wrap px-3 py-2.5 font-mono text-xs leading-5">
            {output}
          </pre>
        </div>
      ) : null}
    </div>
  )

  const side = (
    <>
      {/* The item grid is in the header's menu on a phone already. */}
      <SidePanel className="hidden lg:block">{navigator}</SidePanel>

      <SidePanel className="min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="executions">Runs</TabsTrigger>
          </TabsList>
          <TabsContent value="tests" className="mt-3">
            <TestCasesPanel tests={tests} notice={notice} />
          </TabsContent>
          <TabsContent value="executions" className="mt-3">
            <ExecutionHistoryPanel executions={executions} loading={executionsLoading} />
          </TabsContent>
        </Tabs>
      </SidePanel>
    </>
  )

  return (
    <WorkspaceShell
      tabs={[
        { id: "problem", label: "Problem", icon: FileText },
        { id: "workspace", label: "Code", icon: Code2 },
        { id: "side", label: "Tests", icon: ListChecks },
      ]}
      problem={problem}
      workspace={workspace}
      side={side}
    />
  )
}
