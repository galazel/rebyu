import { useMemo, useState } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { java } from "@codemirror/lang-java"
import { python } from "@codemirror/lang-python"
import { sql } from "@codemirror/lang-sql"
import { Maximize2Icon, Minimize2Icon, RotateCcwIcon } from "@/components/icons"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const PROGRAMMING_LANGUAGES = [
  "Java",
  "JavaScript",
  "Python",
  "C",
  "C++",
  "C#",
  "SQL",
  "Pseudocode",
]

function getLanguageExtension(language) {
  switch (language) {
    case "JavaScript":
      return [javascript()]
    case "Java":
    case "C":
    case "C++":
    case "C#":
      return [java()]
    case "Python":
      return [python()]
    case "SQL":
      return [sql()]
    default:
      return []
  }
}

/** One square key on the editor's toolbar. */
function ToolbarKey({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-rb-wolf transition-colors hover:bg-rb-snow hover:text-rb-eel [&_svg]:size-4"
    >
      {children}
    </button>
  )
}

// CodeMirror-based programming answer workspace.
//
// The editor and its toolbar are one card: language on the left, the keys that
// act on the code (`actions` -- Run Code -- then Reset and fullscreen) on the
// right, all on a single row. The "saved with your answer" note used to take a
// row of its own and push Run Code onto a second line above the editor.
export default function CodeMirrorProgrammingWorkspace({
  value,
  language,
  starterCode = "",
  onChange,
  onLanguageChange,
  readOnly = false,
  actions = null,
}) {
  const [fullscreen, setFullscreen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const extensions = useMemo(() => getLanguageExtension(language), [language])
  const lineCount = (value ?? "").split("\n").length

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-rb-polar p-2 sm:p-4"
          : "flex h-full min-h-0 flex-col"
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-rb-swan bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex shrink-0 items-center gap-2 border-b border-rb-swan bg-rb-polar/60 px-2 py-1.5">
          {readOnly ? (
            <Badge variant="secondary">{language}</Badge>
          ) : (
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger
                size="sm"
                className="h-8 w-[118px] bg-white text-xs font-bold sm:w-[140px]"
                aria-label="Programming language"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMMING_LANGUAGES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="ml-auto flex min-w-0 items-center gap-1">
            {actions}
            {!readOnly && starterCode ? (
              <ToolbarKey label="Reset code" onClick={() => setResetOpen(true)}>
                <RotateCcwIcon aria-hidden="true" />
              </ToolbarKey>
            ) : null}
            <ToolbarKey
              label={fullscreen ? "Exit fullscreen" : "Fullscreen editor"}
              onClick={() => setFullscreen((current) => !current)}
            >
              {fullscreen ? <Minimize2Icon aria-hidden="true" /> : <Maximize2Icon aria-hidden="true" />}
            </ToolbarKey>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeMirror
            value={value}
            onChange={readOnly ? undefined : onChange}
            readOnly={readOnly}
            extensions={extensions}
            height="100%"
            style={{ height: "100%", fontSize: "13.5px" }}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              bracketMatching: true,
              closeBrackets: true,
              indentOnInput: true,
            }}
          />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-rb-swan bg-rb-polar/40 px-3 py-1 text-[11px] font-semibold text-rb-hare">
          <span className="truncate">{readOnly ? "Submitted code" : "Saved with your answer"}</span>
          <span className="shrink-0 tabular-nums">
            {language} · {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset code?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current code will be replaced with the original starter
              code. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onChange(starterCode)
                setResetOpen(false)
              }}
            >
              Reset Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
