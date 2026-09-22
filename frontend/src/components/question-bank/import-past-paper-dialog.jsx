import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { AlertTriangle, CheckCircle, FileText, Loader2, UploadIcon } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { importPastPaper, parsePastPaper } from "@/services/pastPaperService.js"

/**
 * Imports an official ITPEC/IPA past paper into a certification's bank.
 *
 * The dialog is deliberately two stages. Uploading returns DRAFTS, not
 * questions: each one carries the lesson it was matched to, how confident
 * that match is, and anything that went wrong while reading it. Nothing is
 * written until the second step.
 *
 * That is not caution for its own sake. The lesson is chosen by embedding
 * similarity, which agrees with a careful reading about eight times in ten,
 * and a few questions in every paper do not survive the PDF's text layer --
 * stacked fractions, options that are pictures. Both failures are silent: the
 * question looks fine and is filed in the wrong place, or arrives missing an
 * option. Showing them is the whole point of the step.
 *
 * The paper label is typed rather than taken from the filename because the
 * licence requires an accurate source citation on every imported question,
 * and a filename is not evidence of which sitting a paper is from.
 */

const PAPER_NAME_PATTERN = /^\d{4}[AS]_(FE-[AB]|FE_(AM|PM)|IP)$/

/** Below this the match is a guess; the row says so and starts unticked. */
const WEAK_MATCH = 0.3

function QuestionRow({ draft, checked, onToggle }) {
  const blocked = !draft.importable
  return (
    <div
      className={`flex gap-3 border-b px-3 py-2.5 last:border-b-0 ${
        blocked ? "bg-destructive/5" : ""
      }`}
    >
      <Checkbox
        checked={checked}
        disabled={blocked}
        onCheckedChange={() => onToggle(draft.number)}
        aria-label={`Import question ${draft.number}`}
        className="mt-1"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            Q{draft.number}
          </span>
          {blocked ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              needs attention
            </Badge>
          ) : draft.lessonScore < WEAK_MATCH ? (
            <Badge variant="outline" className="gap-1">
              weak lesson match
            </Badge>
          ) : null}
          {draft.imageKey ? <Badge variant="secondary">figure</Badge> : null}
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-foreground">{draft.stem}</p>

        {blocked ? (
          <ul className="mt-1 list-inside list-disc text-xs text-destructive">
            {draft.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            {draft.lessonName ?? "No lesson matched"}
            {draft.lessonScore ? ` · match ${draft.lessonScore.toFixed(2)}` : ""}
            {draft.answer ? ` · answer ${draft.answer}` : ""}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ImportPastPaperDialog({ open, onOpenChange, certificationId, onImported }) {
  const [paperName, setPaperName] = useState("")
  const [kind, setKind] = useState("subject_a")
  const [questionsFile, setQuestionsFile] = useState(null)
  const [answersFile, setAnswersFile] = useState(null)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState(() => new Set())

  const nameIsValid = PAPER_NAME_PATTERN.test(paperName.trim())

  const parse = useMutation({
    mutationFn: () =>
      parsePastPaper({
        certificationId,
        paperName: paperName.trim(),
        kind,
        questionsFile,
        answersFile,
        onUploadProgress: (event) => {
          if (event.total) setUploadPercent(Math.round((event.loaded / event.total) * 100))
        },
      }),
    onSuccess: (data) => {
      setResult(data)
      // Everything usable starts ticked EXCEPT weak matches: those are the
      // ones a person needs to look at, and pre-ticking them would make the
      // review a formality.
      setSelected(
        new Set(
          (data.questions ?? [])
            .filter((q) => q.importable && q.lessonScore >= WEAK_MATCH)
            .map((q) => q.number),
        ),
      )
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message ?? "Could not parse this paper."),
    onSettled: () => setUploadPercent(0),
  })

  const runImport = useMutation({
    mutationFn: () => {
      const approved = (result?.questions ?? [])
        .filter((q) => selected.has(q.number))
        .map((q) => ({
          stem: q.stem,
          citation: q.citation,
          answer: q.answer,
          lessonId: q.lessonId,
          imageKey: q.imageKey,
          choices: Object.entries(q.choices).map(([letter, text]) => ({
            letter,
            text,
            imageKey: q.choiceImages?.[letter] ?? null,
          })),
        }))
      return importPastPaper({ certificationId, questions: approved })
    },
    onSuccess: (data) => {
      toast.success(
        `Imported ${data.added} question${data.added === 1 ? "" : "s"}` +
          (data.alreadyPresent ? `, ${data.alreadyPresent} already present.` : "."),
      )
      onImported?.()
      onOpenChange(false)
      reset()
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message ?? "The import failed; nothing was written."),
  })

  function reset() {
    setResult(null)
    setSelected(new Set())
    setQuestionsFile(null)
    setAnswersFile(null)
    setPaperName("")
    setUploadPercent(0)
  }

  function toggle(number) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(number)) next.delete(number)
      else next.add(number)
      return next
    })
  }

  const drafts = result?.questions ?? []
  const selectableNumbers = useMemo(
    () => drafts.filter((q) => q.importable).map((q) => q.number),
    [drafts],
  )
  const allSelected = selectableNumbers.length > 0 && selectableNumbers.every((n) => selected.has(n))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="flex max-h-[88vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Import a past paper</DialogTitle>
          <DialogDescription>
            Upload an official question paper and its answer key. Questions are matched to
            lessons and shown for review before anything is added. Each imported question
            carries its required source citation.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="paper-name">Paper label</Label>
                <Input
                  id="paper-name"
                  placeholder="2025A_FE-A"
                  value={paperName}
                  onChange={(event) => setPaperName(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The source citation is built from this — e.g. 2025A_FE-A, 2023S_FE_AM,
                  2024A_IP.
                </p>
                {paperName && !nameIsValid ? (
                  <p className="text-xs text-destructive">
                    Expected a form like 2025A_FE-A, 2023S_FE_AM or 2024A_IP.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paper-kind">Paper format</Label>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger id="paper-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject_a">Subject A / morning / IT Passport</SelectItem>
                    <SelectItem value="subject_b">FE Subject B</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Subject B answer groups run past four options and its stems contain
                  programs, so it is read differently.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Question paper (PDF)", questionsFile, setQuestionsFile],
                ["Answer key (PDF)", answersFile, setAnswersFile],
              ].map(([label, file, setFile]) => (
                <div key={label} className="space-y-1.5">
                  <Label>{label}</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm hover:bg-muted/40">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 truncate">
                      {file ? file.name : "Choose a PDF"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              ))}
            </div>

            {parse.isPending ? (
              <div className="space-y-1.5">
                <Progress value={uploadPercent || undefined} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {uploadPercent < 100
                    ? `Uploading ${uploadPercent}%`
                    : "Reading the paper and rendering its figures — this takes a few minutes."}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="size-4 text-primary" aria-hidden="true" />
                {result.importable} of {result.total} ready
              </span>
              {result.needsAttention ? (
                <span className="inline-flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  {result.needsAttention} need attention
                </span>
              ) : null}
              {result.weakMatches ? (
                <span className="text-muted-foreground">
                  {result.weakMatches} weak lesson match
                  {result.weakMatches === 1 ? "" : "es"}
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() =>
                  setSelected(allSelected ? new Set() : new Set(selectableNumbers))
                }
              >
                {allSelected ? "Deselect all" : "Select all usable"}
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-background">
              {drafts.map((draft) => (
                <QuestionRow
                  key={draft.number}
                  draft={draft}
                  checked={selected.has(draft.number)}
                  onToggle={toggle}
                />
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <Button
              onClick={() => parse.mutate()}
              disabled={
                parse.isPending || !nameIsValid || !questionsFile || !answersFile
              }
            >
              {parse.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <UploadIcon className="size-4" aria-hidden="true" />
              )}
              Read paper
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={reset} disabled={runImport.isPending}>
                Choose another paper
              </Button>
              <Button
                onClick={() => runImport.mutate()}
                disabled={runImport.isPending || selected.size === 0}
              >
                {runImport.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Import {selected.size} question{selected.size === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
