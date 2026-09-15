import { useState } from "react"

import { cn } from "@/lib/utils"

/**
 * The frame the coding and diagram items share: problem | workspace | side.
 *
 * On a laptop the three sit side by side, each scrolling on its own. On a phone
 * three columns stacked into one screen-high box left the editor a sliver and
 * put the item grid over the canvas, so below `lg` the columns become tabs --
 * one pane at a time, each with the whole height. Panes are hidden rather than
 * unmounted when they are not showing: the diagram pane holds the draw.io
 * iframe, and unmounting it would download the editor again on every tab tap.
 */
export function WorkspaceShell({ tabs, problem, workspace, side }) {
  const [pane, setPane] = useState("problem")

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2 lg:grid lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.7fr)_minmax(270px,300px)] lg:grid-rows-[minmax(0,1fr)] lg:gap-3">
      <div
        role="tablist"
        aria-label="Item panes"
        className="grid shrink-0 grid-cols-3 gap-1 rounded-xl border border-rb-swan bg-white p-1 lg:hidden"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = pane === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPane(tab.id)}
              className={cn(
                "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-extrabold transition-colors",
                active ? "bg-rb-feather text-white shadow-sm" : "text-rb-wolf hover:bg-rb-polar"
              )}
            >
              {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <section
        className={cn(
          "min-h-0 flex-1 overflow-y-auto rounded-2xl border border-rb-swan bg-white lg:block",
          pane !== "problem" && "hidden"
        )}
      >
        {problem}
      </section>

      {/* Invisible, not display:none, when another tab is showing: the diagram
          canvas measures itself on load, and inside a hidden box it measured
          zero and opened empty. Kept laid out underneath at full size instead. */}
      <section
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          pane !== "workspace" && "max-lg:pointer-events-none max-lg:invisible max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-12"
        )}
        aria-hidden={pane !== "workspace" ? true : undefined}
      >
        {workspace}
      </section>

      <aside
        className={cn(
          "min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:flex",
          pane === "side" ? "flex" : "hidden"
        )}
      >
        {side}
      </aside>
    </div>
  )
}

/**
 * The problem column, read like a worksheet: chips for the item's facts, the
 * title, the brief, instructions set apart on a green margin, then whatever the
 * layout adds (sub-questions).
 */
export function ProblemStatement({ question, index, typeLabel, imageSrc, children }) {
  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-rb-feather px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
          Item {index + 1}
        </span>
        <span className="rounded-full bg-rb-feather-wash px-2.5 py-1 text-[11px] font-bold text-rb-feather-lip">
          {typeLabel}
        </span>
        {question.difficultyLevel ? (
          <span className="rounded-full border border-rb-swan px-2.5 py-1 text-[11px] font-bold capitalize text-rb-wolf">
            {question.difficultyLevel}
          </span>
        ) : null}
        {question.points != null ? (
          <span className="ml-auto rounded-full bg-rb-bee/25 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-rb-eel">
            {Number(question.points)} pts
          </span>
        ) : null}
      </div>

      {question.title ? (
        <h2 className="font-rb-display text-lg font-extrabold leading-snug text-rb-eel sm:text-xl">
          {question.title}
        </h2>
      ) : null}

      <p className="whitespace-pre-wrap text-sm leading-7 text-rb-eel">{question.question}</p>

      {question.instructions ? (
        <div className="rounded-xl border-l-4 border-rb-feather bg-rb-feather-wash/60 px-3.5 py-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-rb-feather-lip">
            Instructions
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-rb-eel/85">
            {question.instructions}
          </p>
        </div>
      ) : null}

      {imageSrc ? (
        <img src={imageSrc} alt="Problem reference" className="mx-auto block h-auto max-w-full rounded-lg" />
      ) : null}

      {children}
    </div>
  )
}

/** A titled card for the side column. */
export function SidePanel({ title, icon: Icon, aside, className, children }) {
  return (
    <div className={cn("rounded-2xl border border-rb-swan bg-white p-3", className)}>
      {title ? (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-rb-wolf">
            {Icon ? <Icon className="size-3.5 text-rb-feather" aria-hidden="true" /> : null}
            {title}
          </p>
          {aside}
        </div>
      ) : null}
      {children}
    </div>
  )
}
