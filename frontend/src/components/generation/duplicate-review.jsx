import { useMemo, useState } from "react"
import { Check, RotateCw, ShieldCheck } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const REPLACE = "replace"
const KEEP = "keep"

export function isDuplicateReview(review) {
  return review?.stage === "DUPLICATES" || review?.payload?.kind === "duplicates"
}

function initialChoices(payload) {
  const choices = {}
  for (const group of payload?.groups ?? []) {
    for (const copy of group.duplicates ?? []) choices[copy.id] = copy.choice === KEEP ? KEEP : REPLACE
  }
  return choices
}

/**
 * The duplicate review that closes a run: every group of questions that test
 * the same thing, the copy that stays, and a replace / keep choice for each of
 * the others. "Replace" removes the copy and writes a new question in its
 * place; "Keep" leaves both.
 */
export function DuplicateReview({ payload, submitting, onSubmit }) {
  const [choices, setChoices] = useState(() => initialChoices(payload))
  const groups = payload?.groups ?? []

  const counts = useMemo(() => {
    const values = Object.values(choices)
    return {
      replace: values.filter((value) => value === REPLACE).length,
      keep: values.filter((value) => value === KEEP).length,
    }
  }, [choices])

  const setAll = (choice) =>
    setChoices((current) => Object.fromEntries(Object.keys(current).map((id) => [id, choice])))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {payload?.round > 1 ? `Check ${payload.round}: ` : ""}
            {groups.length === 1 ? "1 group" : `${groups.length} groups`} of questions test the same
            thing. For each extra copy, <strong className="font-medium text-foreground">Replace</strong>{" "}
            writes a new question in its place;{" "}
            <strong className="font-medium text-foreground">Keep</strong> leaves both.
          </p>

          <ol className="space-y-4">
            {groups.map((group, index) => (
              <DuplicateGroup
                key={group.id}
                number={index + 1}
                group={group}
                choices={choices}
                disabled={submitting}
                onChoose={(id, choice) => setChoices((current) => ({ ...current, [id]: choice }))}
              />
            ))}
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-background px-6 py-4">
        <Button
          size="sm"
          disabled={submitting}
          onClick={() => onSubmit?.({ action: "approve", payload: { choices } })}
        >
          <Check className="mr-2 size-4" />
          {counts.replace
            ? `Replace ${counts.replace}${counts.keep ? `, keep ${counts.keep}` : ""}`
            : "Keep all and finish"}
        </Button>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

        <Button size="sm" variant="outline" disabled={submitting} onClick={() => setAll(REPLACE)}>
          <RotateCw className="mr-2 size-4" />
          Replace all
        </Button>
        <Button size="sm" variant="outline" disabled={submitting} onClick={() => setAll(KEEP)}>
          <Check className="mr-2 size-4" />
          Keep all
        </Button>

        <span className="ml-auto text-xs text-muted-foreground">
          You decide once. If a replacement repeats another question, it is replaced again automatically.
        </span>
      </div>
    </div>
  )
}

function DuplicateGroup({ number, group, choices, disabled, onChoose }) {
  return (
    <li className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3.5 py-2">
        <span className="font-mono text-xs text-muted-foreground">Group {number}</span>
        {group.reason ? <span className="text-xs text-muted-foreground">· {group.reason}</span> : null}
      </div>

      <div className="space-y-2.5 p-3.5">
        <QuestionCopy copy={group.keep} badge={<Badge variant="secondary">Stays</Badge>} muted />

        {(group.duplicates ?? []).map((copy) => (
          <QuestionCopy
            key={copy.id}
            copy={copy}
            badge={
              <ChoiceToggle
                value={choices[copy.id] ?? REPLACE}
                saved={copy.saved}
                disabled={disabled}
                onChange={(choice) => onChoose(copy.id, choice)}
              />
            }
            dimmed={(choices[copy.id] ?? REPLACE) === REPLACE}
          />
        ))}
      </div>
    </li>
  )
}

function QuestionCopy({ copy, badge, muted, dimmed }) {
  if (!copy) return null
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        muted ? "border-border bg-muted/20" : "border-amber-500/40 bg-amber-500/[0.04]",
        dimmed && "opacity-75",
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-foreground">{copy.where}</span>
        {copy.type ? <Badge variant="outline">{copy.type}</Badge> : null}
        {copy.saved ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" /> saved
          </span>
        ) : null}
        <span className="ml-auto">{badge}</span>
      </div>
      <p className={cn("text-sm leading-6 text-foreground", dimmed && "line-through decoration-muted-foreground/50")}>
        {copy.question}
      </p>
      {copy.answer ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Answer: <span className="text-foreground">{copy.answer}</span>
        </p>
      ) : null}
    </div>
  )
}

function ChoiceToggle({ value, saved, disabled, onChange }) {
  const options = [
    { value: REPLACE, label: saved ? "Replace (deletes saved copy)" : "Replace", icon: RotateCw },
    { value: KEEP, label: "Keep", icon: Check },
  ]
  return (
    <div role="radiogroup" aria-label="What to do with this copy" className="inline-flex rounded-md border border-border p-0.5">
      {options.map((option) => {
        const Icon = option.icon
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-3.5" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Read-only view of a duplicate review, for the version history and artifacts. */
export function DuplicateGroupsView({ payload }) {
  const groups = payload?.groups ?? []
  if (!groups.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No duplicate questions found.</p>
  }
  return (
    <ol className="space-y-3">
      {groups.map((group, index) => (
        <li key={group.id} className="space-y-2 rounded-lg border border-border p-3">
          <p className="font-mono text-xs text-muted-foreground">
            Group {index + 1}
            {group.reason ? ` · ${group.reason}` : ""}
          </p>
          <QuestionCopy copy={group.keep} badge={<Badge variant="secondary">Stays</Badge>} muted />
          {(group.duplicates ?? []).map((copy) => (
            <QuestionCopy
              key={copy.id}
              copy={copy}
              badge={<Badge variant="outline">{copy.choice === KEEP ? "Keep" : "Replace"}</Badge>}
            />
          ))}
        </li>
      ))}
    </ol>
  )
}
