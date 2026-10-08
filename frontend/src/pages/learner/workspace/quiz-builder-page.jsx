import { useState } from "react"

import {
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  Trash2,
} from "@/components/icons"
import { RebyuCard, TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import {
  FeatureHeader,
  NotConnectedNote,
  UploadDropzone,
  formatBytes,
  useUploadedFile,
} from "./workspace-shared.jsx"


const OPTION_LABELS = ["A", "B", "C", "D"]

const EXAMPLE_QUESTIONS = [
  {
    id: 1,
    prompt: "Which technique gathers requirements from a group in one sitting?",
    options: ["Workshop", "Interview", "Questionnaire", "Observation"],
    answer: 0,
  },
  {
    id: 2,
    prompt: "What does low coupling describe?",
    options: [
      "Modules depending little on each other",
      "A module doing one job well",
      "Code with no comments",
      "A fast build",
    ],
    answer: null,
  },
  {
    id: 3,
    prompt: "Which level of testing comes last?",
    options: ["Unit", "Integration", "System", "Acceptance"],
    answer: 3,
  },
]

export default function QuizBuilderPage() {
  const { file, error, accept, clear } = useUploadedFile()
  const [questions, setQuestions] = useState([])
  const [generating, setGenerating] = useState(false)

  function generate() {
    setGenerating(true)
    window.setTimeout(() => {
      setQuestions(EXAMPLE_QUESTIONS.map((question) => ({
        ...question,
        options: [...question.options],
      })))
      setGenerating(false)
    }, 800)
  }

  function update(id, patch) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...patch } : question
      )
    )
  }

  function updateOption(id, index, value) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? {
              ...question,
              options: question.options.map((option, i) => (i === index ? value : option)),
            }
          : question
      )
    )
  }

  function isReady(question) {
    return (
      question.prompt.trim() &&
      question.options.filter((option) => option.trim()).length >= 2 &&
      question.answer !== null &&
      question.options[question.answer]?.trim()
    )
  }

  const ready = questions.filter(isReady)

  if (!file) {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
        <FeatureHeader
          title="Quiz Builder"
          subtitle="Draft questions from a document and set the answers."
        />
        <div className="min-h-0 flex-1 border-t border-border">
          <UploadDropzone
            onFile={accept}
            error={error}
            icon={Target}
            title="Build a quiz from your notes"
            subtitle="Drop a handout or reviewer here. Questions are drafted from it for you to reword, and you set which answer is correct."
          />
        </div>
        <div className="mt-4">
          <NotConnectedNote>
            Question extraction is not wired up yet, so generating shows example
            questions rather than anything read from your file.
          </NotConnectedNote>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <FeatureHeader
        title="Quiz Builder"
        subtitle="Draft questions from a document and set the answers."
      >
        <div className="flex flex-wrap items-center gap-2">
          <TactileButton variant="ghost" size="sm" onClick={clear}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Change file
          </TactileButton>
          <TactileButton
            size="sm"
            disabled={ready.length === 0}
            onClick={() => {}}
          >
            <Save className="size-4" aria-hidden="true" />
            Save quiz
          </TactileButton>
        </div>
      </FeatureHeader>

      <div className="min-h-0 flex-1 border-t border-border p-4 lg:p-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-rb-tile bg-rb-macaw-wash text-rb-macaw-lip">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-rb-eel">{file.name}</p>
                <p className="text-xs font-bold text-rb-hare">
                  {formatBytes(file.size)} · {questions.length} question
                  {questions.length === 1 ? "" : "s"} · {ready.length} ready
                </p>
              </div>
            </div>

            <TactileButton size="sm" onClick={generate} disabled={generating}>
              {generating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {generating ? "Reading…" : "Generate questions"}
            </TactileButton>
          </div>

          {questions.length > 0 ? (
            <p className="mt-4 rounded-rb-tile border-2 border-rb-bee/50 bg-rb-bee-wash px-3 py-2 text-xs font-bold text-rb-fox-lip">
              Example questions — extraction is not connected, so these did not
              come from your file.
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {questions.length === 0 ? (
              <RebyuCard className="p-8 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-rb-macaw-wash text-rb-macaw-lip">
                  <Sparkles className="size-6" aria-hidden="true" />
                </span>
                <p className="mt-5 font-rb-display text-lg font-extrabold text-rb-eel">
                  Ready when you are
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-rb-wolf">
                  Draft the questions from {file.name}. You can reword any of them
                  and set the answers, and nothing is saved until you say so.
                </p>
              </RebyuCard>
            ) : (
              questions.map((question, index) => (
                <RebyuCard key={question.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-rb-control border-2 border-rb-macaw-lip/40 font-rb-display text-xs font-extrabold text-rb-macaw-lip">
                        {index + 1}
                      </span>
                      <span className="font-rb-display text-xs font-extrabold uppercase tracking-[0.2em] text-rb-macaw-lip">
                        Question
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      {!isReady(question) ? (
                        <span className="rounded-rb-control border-2 border-rb-bee/50 bg-rb-bee-wash px-2 py-0.5 text-xs font-bold text-rb-fox-lip">
                          {!question.prompt.trim()
                            ? "Needs a question"
                            : question.options.filter((o) => o.trim()).length < 2
                              ? "Needs two options"
                              : "Mark the correct answer"}
                        </span>
                      ) : null}
                      <TactileButton
                        variant="ghost"
                        size="sm"
                        className="rb-btn-icon"
                        onClick={() =>
                          setQuestions((current) =>
                            current.filter((entry) => entry.id !== question.id)
                          )
                        }
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </TactileButton>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={question.prompt}
                    onChange={(event) => update(question.id, { prompt: event.target.value })}
                    placeholder="Which technique surfaces requirements from a group at once?"
                    className="mt-3 w-full resize-y rounded-rb-card border-2 border-border bg-white p-4 font-rb-display text-lg font-extrabold leading-snug text-rb-eel outline-none placeholder:font-medium placeholder:text-rb-hare focus-visible:border-rb-macaw"
                  />

                  <fieldset className="mt-3">
                    <legend className="mb-2 font-rb-display text-xs font-extrabold uppercase tracking-[0.2em] text-rb-hare">
                      Options — tick the correct one
                    </legend>


                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const correct = question.answer === optionIndex
                        return (
                          <div
                            key={optionIndex}
                            data-state={correct ? "correct" : "idle"}
                            className="rb-answer !cursor-default"
                          >
                            <button
                              type="button"
                              onClick={() => update(question.id, { answer: optionIndex })}
                              aria-label={`Mark option ${OPTION_LABELS[optionIndex]} correct`}
                              aria-pressed={correct}
                              className="rb-answer-key cursor-pointer transition-transform hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw"
                            >
                              {correct ? (
                                <Check className="size-4" aria-hidden="true" />
                              ) : (
                                OPTION_LABELS[optionIndex]
                              )}
                            </button>

                            <input
                              value={option}
                              onChange={(event) =>
                                updateOption(question.id, optionIndex, event.target.value)
                              }
                              placeholder={`Option ${OPTION_LABELS[optionIndex]}`}
                              aria-label={`Option ${OPTION_LABELS[optionIndex]} text`}
                              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-medium text-current outline-none placeholder:text-rb-hare"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </fieldset>
                </RebyuCard>
              ))
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
