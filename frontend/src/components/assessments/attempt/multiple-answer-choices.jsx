import { CheckCircle2, XCircle } from "@/components/icons"
import { AuthedImage } from "@/lib/authed-media.jsx"
import { cn } from "@/lib/utils"

/** Several choices are right; the learner ticks all of them (Cisco-style "Select 2"). */
export function isMultipleAnswer(question) {
  return String(question?.questionType ?? "").toUpperCase() === "MULTIPLE_ANSWER"
}

/**
 * The selection travels as `learnerAnswer` holding a JSON array of choice ids ("[12,15]"),
 * which is what the server marks. An empty selection is null, so it reads as unanswered.
 */
export function parseChoiceIds(learnerAnswer) {
  if (!learnerAnswer) return []
  try {
    const parsed = JSON.parse(learnerAnswer)
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : []
  } catch {
    return []
  }
}

export function serializeChoiceIds(ids) {
  return ids.length ? JSON.stringify(ids) : null
}

/** Exact-set match, the same rule the server applies. */
export function isExactSelection(selectedIds, correctIds) {
  if (!Array.isArray(correctIds) || correctIds.length === 0) return false
  const correct = new Set(correctIds.map(Number))
  return selectedIds.length === correct.size && selectedIds.every((id) => correct.has(Number(id)))
}

export function MultipleAnswerChoices({
  question,
  learnerAnswer,
  onChange,
  disabled = false,
  correctChoiceIds = null,
  className,
}) {
  const choices = question?.choices ?? []
  const selectCount = Number(question?.selectCount) || null
  const selected = parseChoiceIds(learnerAnswer)
  const revealed = Array.isArray(correctChoiceIds)
  const correct = new Set((correctChoiceIds ?? []).map(Number))
  const full = selectCount != null && selected.length >= selectCount

  function toggle(choiceId) {
    if (disabled) return
    const next = selected.includes(choiceId)
      ? selected.filter((id) => id !== choiceId)
      : full
        ? selected
        : [...selected, choiceId]
    onChange(serializeChoiceIds(next))
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-semibold text-[var(--tg-ink)]">
        {selectCount ? `Select ${selectCount} choices.` : "Select all that apply."}
        <span className="ml-2 font-medium text-muted-foreground">
          {selected.length} selected
        </span>
      </p>

      <div role="group" aria-label="Answer choices" className="grid gap-2">
        {choices.map((choice, choiceIndex) => {
          const isSelected = selected.includes(choice.choiceId)
          const isRight = revealed && correct.has(Number(choice.choiceId))
          const isWrong = revealed && isSelected && !isRight
          const missed = isRight && !isSelected
          const blocked = !isSelected && full
          const letter = String.fromCharCode(65 + choiceIndex)
          return (
            <button
              key={choice.choiceId ?? choiceIndex}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Choice ${letter}`}
              disabled={disabled || blocked}
              onClick={() => toggle(choice.choiceId)}
              className={cn(
                "flex min-h-14 items-start gap-3 rounded-[1rem] border-2 px-4 py-3 text-left text-[15px] font-medium leading-6 shadow-[0_3px_0_var(--tg-line)] transition",
                !disabled && !blocked && "hover:border-[var(--tg)] active:translate-y-[2px] active:shadow-none",
                isRight
                  ? "border-rb-leaf bg-rb-leaf-wash text-rb-leaf-lip shadow-none"
                  : isWrong
                    ? "border-rb-cardinal bg-rb-cardinal-wash text-rb-cardinal-lip shadow-none"
                    : isSelected
                      ? "border-[var(--tg)] bg-[var(--tg-softer)] text-foreground ring-4 ring-[var(--tg-soft)]"
                      : "border-[var(--tg-line)] bg-card text-foreground",
                blocked && !revealed && "cursor-not-allowed opacity-50",
                revealed && !isRight && !isWrong && "opacity-60",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md border-2 text-xs font-extrabold",
                  isRight
                    ? "border-rb-leaf bg-rb-leaf text-white"
                    : isWrong
                      ? "border-rb-cardinal bg-rb-cardinal text-white"
                      : isSelected
                        ? "tg-solid-soft border-[var(--tg)]"
                        : "border-[var(--tg-line)] bg-card",
                )}
              >
                {isWrong ? <XCircle className="size-3.5" /> : isSelected || isRight ? <CheckCircle2 className="size-3.5" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="mr-1.5 font-extrabold text-[var(--tg-ink)]">{letter}.</span>
                {choice.choiceText}
                {missed ? (
                  <span className="ml-2 text-xs font-semibold">(you missed this one)</span>
                ) : null}
                <AuthedImage
                  imageKey={choice.imageKey}
                  className="mt-2 max-h-32 w-auto rounded-lg border object-contain"
                  placeholderClassName="mt-2 h-16 w-full max-w-[10rem]"
                />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MultipleAnswerChoices
