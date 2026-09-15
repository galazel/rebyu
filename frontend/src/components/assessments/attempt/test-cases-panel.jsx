import { useState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  EyeOffIcon,
  InfoIcon,
  XCircleIcon,
} from "@/components/icons"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TEST_STATUS = {
  NOT_RUN: { label: "Not run", icon: CircleDashedIcon, tone: "text-muted-foreground" },
  PENDING: { label: "Pending", icon: CircleDashedIcon, tone: "text-muted-foreground" },
  PASSED: { label: "Passed", icon: CheckCircle2Icon, tone: "text-[#2f7d55]" },
  FAILED: { label: "Failed", icon: XCircleIcon, tone: "text-[#c8342b]" },
  COMPILE_ERROR: { label: "Compile error", icon: AlertTriangleIcon, tone: "text-[#c8342b]" },
  RUNTIME_ERROR: { label: "Runtime error", icon: AlertTriangleIcon, tone: "text-[#c8342b]" },
  TIME_LIMIT_EXCEEDED: { label: "Too slow", icon: AlertTriangleIcon, tone: "text-[#c97a1e]" },
}

function Block({ label, value, tone }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <pre
        className={cn(
          "max-h-40 overflow-auto whitespace-pre-wrap rounded-[var(--radius-rb-control)] bg-muted/50 p-2 font-mono text-xs",
          tone
        )}
      >
        {value === null || value === undefined ? "—" : value === "" ? "(empty)" : value}
      </pre>
    </div>
  )
}

function TestRow({ test }) {
  const hasOutputs = test.expectedOutput != null || test.actualOutput != null
  const canExpand = test.sample && (test.input != null || hasOutputs)
  // A failed sample opens on its own: the comparison is the reason to look.
  const [open, setOpen] = useState(false)
  const status = TEST_STATUS[test.status] ?? { label: test.status, icon: CircleDashedIcon, tone: "text-muted-foreground" }
  const StatusIcon = status.icon

  return (
    <li className="rounded-[var(--radius-rb-control)] border">
      <button
        type="button"
        onClick={() => canExpand && setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
          canExpand ? "cursor-pointer" : "cursor-default"
        )}
        aria-expanded={canExpand ? open : undefined}
      >
        <span className="flex min-w-0 items-center gap-2">
          {canExpand ? (
            open ? (
              <ChevronDownIcon className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronRightIcon className="size-4 shrink-0" aria-hidden="true" />
            )
          ) : (
            <EyeOffIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="truncate font-medium">{test.label}</span>
          <Badge variant={test.sample ? "secondary" : "outline"} className="text-[10px]">
            {test.sample ? "Sample" : "Hidden"}
          </Badge>
        </span>
        <span className={cn("flex shrink-0 items-center gap-1.5 text-xs font-semibold", status.tone)}>
          <StatusIcon className="size-3.5" aria-hidden="true" />
          {status.label}
        </span>
      </button>

      {canExpand && open ? (
        <div className="space-y-2 border-t px-3 py-2.5">
          {test.input != null ? <Block label="Input" value={test.input} /> : null}
          {hasOutputs ? (
            <>
              <Block label="Expected output" value={test.expectedOutput} />
              <Block
                label="Your output"
                value={test.actualOutput}
                tone={test.status === "FAILED" ? "text-[#c8342b]" : undefined}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

// Right-panel "Tests" tab. A sample test opens to show its input, the output it
// expects and what your program printed; hidden tests show a label and a
// verdict only, never their input or expected output.
export default function TestCasesPanel({ tests, notice }) {
  const list = Array.isArray(tests) ? tests : []

  return (
    <div className="space-y-3">
      {notice ? (
        <div className="flex items-start gap-2 rounded-[var(--radius-rb-control)] border border-amber-300 bg-amber-50 p-2.5 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}

      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No test cases are attached to this item.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((test) => (
            <TestRow key={test.index} test={test} />
          ))}
        </ul>
      )}
    </div>
  )
}
