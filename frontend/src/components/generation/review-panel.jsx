import { useState } from "react"
import { Check, CheckCheck, FastForward, Pencil, RotateCw, SkipForward, Sparkles, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ReviewActions({ payload, total, onSubmit, submitting, disabled }) {
  const [mode, setMode] = useState(null)
  const [instructions, setInstructions] = useState("")
  const [draft, setDraft] = useState("")
  const [draftError, setDraftError] = useState(null)

  const busy = submitting || disabled

  const submit = (action, extra = {}) => {
    onSubmit?.({ action, ...extra })
    reset()
  }

  function reset() {
    setMode(null)
    setInstructions("")
    setDraft("")
    setDraftError(null)
  }

  const startEdit = () => {
    setDraft(JSON.stringify(payload, null, 2))
    setDraftError(null)
    setMode("edit")
  }

  const submitEdit = () => {
    let parsed
    try {
      parsed = JSON.parse(draft)
    } catch (error) {
      setDraftError(`That is not valid JSON — ${error.message}`)
      return
    }
    submit("edit", { payload: parsed })
  }

  if (mode === "improve") {
    return (
      <Composer
        label="What should the AI change?"
        onCancel={reset}
        confirm={
          <Button
            size="sm"
            disabled={busy || !instructions.trim()}
            onClick={() => submit("improve", { instructions: instructions.trim() })}
          >
            <Sparkles className="mr-2 size-4" />
            Regenerate with this feedback
          </Button>
        }
      >
        <Textarea
          id="review-improve-instructions"
          autoFocus
          rows={3}
          placeholder="e.g. the distractors are too obvious — make them plausible misconceptions a learner would actually hold"
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          className="resize-y"
        />
      </Composer>
    )
  }

  if (mode === "edit") {
    return (
      <Composer
        label="Edit this item"
        error={draftError}
        onCancel={reset}
        confirm={
          <Button size="sm" disabled={busy} onClick={submitEdit}>
            <Check className="mr-2 size-4" />
            Save and continue
          </Button>
        }
      >
        <Textarea
          id="review-edit-payload"
          autoFocus
          rows={16}
          spellCheck={false}
          className="resize-y font-mono text-xs leading-relaxed"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setDraftError(null)
          }}
        />
      </Composer>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={busy} onClick={() => submit("approve")}>
        <Check className="mr-2 size-4" />
        Approve
      </Button>

      {total > 1 ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          title="Approve this item and every remaining item in this phase without pausing again"
          onClick={() => submit("approve_remaining")}
        >
          <CheckCheck className="mr-2 size-4" />
          Approve remaining
        </Button>
      ) : null}

      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        title="Approve this and every remaining checkpoint — the run generates the rest on its own"
        onClick={() => submit("approve_all")}
      >
        <FastForward className="mr-2 size-4" />
        Finish without me
      </Button>

      <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

      <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMode("improve")}>
        <Sparkles className="mr-2 size-4" />
        Improve with AI
      </Button>

      <Button size="sm" variant="ghost" disabled={busy} onClick={startEdit}>
        <Pencil className="mr-2 size-4" />
        Edit manually
      </Button>

      <Button size="sm" variant="ghost" disabled={busy} onClick={() => submit("regenerate")}>
        <RotateCw className="mr-2 size-4" />
        Regenerate
      </Button>

      <Button size="sm" variant="ghost" disabled={busy} onClick={() => submit("skip")}>
        <SkipForward className="mr-2 size-4" />
        Skip
      </Button>
    </div>
  )
}

function Composer({ label, error, children, confirm, onCancel }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Button size="icon-sm" variant="ghost" onClick={onCancel} aria-label="Cancel">
          <X className="size-4" />
        </Button>
      </div>

      {children}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">{confirm}</div>
    </div>
  )
}
