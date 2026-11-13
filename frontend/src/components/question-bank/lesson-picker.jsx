import { useState } from "react"
import { BookOpen, Check, Search } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

/** A bounded, searchable lesson chooser shared by authoring roles. */
export function LessonPicker({
  options,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Choose a lesson",
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const selected = options.find((option) => option.value === value)
  const visible = options.filter((option) =>
    `${option.label} ${option.description ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  )
  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={selected ? `Change lesson: ${selected.label}` : placeholder}
        className="h-auto min-h-11 w-full min-w-0 justify-start py-2.5 text-left whitespace-normal"
        onClick={() => {
          setSearch("")
          setOpen(true)
        }}
      >
        <BookOpen className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 break-words">
          {selected?.label ?? placeholder}
        </span>
        {selected ? (
          <span className="shrink-0 text-xs text-muted-foreground">Change</span>
        ) : null}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85dvh] min-w-0 flex-col gap-3 overflow-hidden p-4 sm:max-w-xl">
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle>Choose a lesson</DialogTitle>
            <DialogDescription>
              Search the course structure, then select a lesson to continue
              building questions.
            </DialogDescription>
          </DialogHeader>
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              aria-label="Search course lessons"
              placeholder="Search lessons or categories…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 pl-9 text-base"
            />
          </div>
          <ul
            aria-label="Course lessons"
            className="min-h-0 space-y-1 overflow-y-auto overscroll-contain"
          >
            {visible.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={option.value === value}
                  className="flex min-h-11 w-full min-w-0 items-start gap-2 rounded-lg border border-border p-3 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => {
                    if (onValueChange(option.value) !== false) setOpen(false)
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold break-words">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="mt-1 block text-xs break-words text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {option.value === value ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              </li>
            ))}
            {!visible.length ? (
              <li
                className="p-5 text-center text-sm text-muted-foreground"
                role="status"
              >
                No lessons found. Try another search.
              </li>
            ) : null}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}
