import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export const QUESTION_TYPE_OPTIONS = [
  {
    value: "MCQ",
    label: "Multiple choice",
    description: "Four options, one right answer. Marked automatically.",
  },
  {
    value: "SHORT_ANSWER",
    label: "Short answer",
    description: "One exact term, value or acronym. Marked by exact match.",
  },
  {
    value: "FILL_IN_BLANK",
    label: "Fill in the blanks",
    description:
      "A passage with its key terms blanked, answered from a candidate list. Marked by exact match.",
  },
  {
    value: "DESCRIPTIVE",
    label: "Descriptive",
    description: "Explain, compare or justify in writing. Marked on meaning.",
  },
  {
    value: "CRITICAL_THINKING",
    label: "Critical thinking",
    description:
      "Programming and diagramming tasks — the learner writes code or builds a model, then answers questions about it.",
  },
]

export function QuestionTypeChoice({ value = [], onChange, disabled }) {
  function toggle(optionValue) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue]
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Question formats <span className="font-normal text-muted-foreground">(optional)</span>
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Tick what the real exam contains. Everything generated — lesson
          quizzes, unit exams, the diagnostic, the mock and the question bank —
          uses only these. Leave all unticked and the planner researches the
          real paper and decides.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {QUESTION_TYPE_OPTIONS.map((option) => {
          const id = `question-type-${option.value}`
          const checked = value.includes(option.value)

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                checked
                  ? "border-primary/60 bg-primary/5"
                  : "border-border hover:bg-muted/40"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => toggle(option.value)}
                disabled={disabled}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <Label
                  htmlFor={id}
                  className="cursor-pointer text-sm font-medium text-foreground"
                >
                  {option.label}
                </Label>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
