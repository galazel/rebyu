import { useMemo, useState } from "react"
import { useTutorWidgetProgress } from "@/hooks/useTutorWidgetProgress.js"
import { Game } from "@/components/learner/learning-game-widgets.jsx"
import { Celebration, GameFooter, GameHint, Ico, ProgressBar, StepNav } from "@/components/learner/tutor-game-kit.jsx"
import { applySimulationChoice, simulationState, storyState } from "@/lib/decision-games.js"

const button = "tg-card w-full !items-start !px-4 !py-3 !font-semibold enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"

/** Decision games share the standard footer: undo one decision, a progress score, and a confirmed restart. */
function DecisionControls({ count, score, onBack, onRestart }) {
  return <GameFooter score={score} onRestart={onRestart} restartLabel="Start over" restartDisabled={!count} confirmRestart={`Clear ${count === 1 ? "your 1 decision" : `all ${count} decisions`}?`}>
    <button type="button" className="tg-btn" disabled={!count} onClick={onBack}><Ico name="undo" className="size-4" />Undo last decision</button>
  </GameFooter>
}

const OUTCOME = { best: { icon: "trophy", label: "Best ending", tone: "text-emerald-500" }, mixed: { icon: "think", label: "Mixed ending", tone: "text-amber-500" }, poor: { icon: "warning", label: "Poor ending", tone: "text-rose-500" } }

/** Choices (texts) along the shortest route from the start to `goal`, or null. */
function routeTo(byId, startId, goal) {
  const queue = [[startId, []]], seen = new Set([startId])
  while (queue.length) {
    const [id, path] = queue.shift()
    if (goal(byId[id])) return path
    for (const choice of byId[id]?.choices ?? []) if (!seen.has(choice.nextId) && byId[choice.nextId]) { seen.add(choice.nextId); queue.push([choice.nextId, [...path, choice.text]]) }
  }
  return null
}

export function BranchingStoryGame({ data }) {
  const [history, setHistory] = useTutorWidgetProgress("decisions", [])
  const { node, decisions, feedback } = storyState(data, history)
  const byId = useMemo(() => Object.fromEntries(data.nodes.map((n) => [n.id, n])), [data.nodes])
  const depth = useMemo(() => {
    const memo = {}
    const longest = (id, guard = new Set()) => { if (memo[id] != null) return memo[id]; if (guard.has(id) || !byId[id]) return 0; guard.add(id); const n = byId[id]; memo[id] = n.choices.length ? 1 + Math.max(...n.choices.map((c) => longest(c.nextId, guard))) : 0; return memo[id] }
    return longest(data.startId)
  }, [byId, data.startId])
  // The choices taken so far, replayed from the start.
  const path = []
  let cursor = byId[data.startId]
  for (const d of decisions) { const choice = cursor?.choices[d]; if (!choice) break; path.push(choice.text); cursor = byId[choice.nextId] }
  const lastChoice = decisions.length ? path.at(-1) : null
  const ending = node && !node.choices.length
  const endings = data.nodes.filter((n) => !n.choices.length)
  const rated = endings.some((n) => n.outcome)
  const best = rated && ending && node.outcome !== "best" ? routeTo(byId, data.startId, (n) => n && !n.choices.length && n.outcome === "best") : null
  const bestNode = best ? endings.find((n) => n.outcome === "best" && routeTo(byId, data.startId, (x) => x === n)) : null
  const outcome = OUTCOME[node?.outcome]
  return <Game data={data}>
    <GameHint>Read each scene and choose what you would do. You can undo a decision at any time.</GameHint>
    {data.role ? <p className="mb-3 text-sm font-semibold"><Ico name="role" className="mr-1.5 text-[var(--tg)]" />You play the <strong>{data.role}</strong>.</p> : null}
    {node ? <>
      <div className="mb-3 rounded-2xl bg-[var(--tg-soft)] p-3">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm font-extrabold">
          <span><Ico name={ending ? "finish" : "map"} className="mr-1.5 text-[var(--tg)]" />{ending ? "Ending reached" : `Step ${decisions.length + 1} of up to ${depth}`}</span>
          <span className="text-xs text-muted-foreground">{decisions.length} decision{decisions.length === 1 ? "" : "s"} made</span>
        </div>
        <ProgressBar value={ending ? depth : decisions.length} total={depth || 1} label="Story progress" />
        {path.length ? <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold" aria-label="Your path so far">{path.map((text, i) => <li key={i} className="flex items-center gap-1.5">{i ? <span aria-hidden="true" className="text-muted-foreground">→</span> : null}<span className="rounded-full bg-card px-2 py-0.5 ring-1 ring-[var(--tg-line)]">{i + 1}. {text}</span></li>)}</ol> : null}
      </div>
      {lastChoice ? <div role="status" className="mb-4 rounded-2xl border border-[var(--tg-line)] bg-card p-3 text-sm">
        <p className="tg-kicker mb-1">You chose</p>
        <p className="font-extrabold">“{lastChoice}”</p>
        {feedback ? <p className="mt-1.5 leading-6"><Ico name="idea" className="mr-1.5 text-amber-500" />{feedback}</p> : null}
      </div> : null}
      {ending ? (
          <div role="status" className="tg-result flex animate-in fade-in zoom-in-95 flex-col gap-3 p-5 duration-500">
            <div className="flex items-center gap-3"><Ico name={outcome?.icon ?? "finish"} className={`tg-confetti size-9 ${outcome?.tone ?? "text-[var(--tg)]"}`} /><div><p className="tg-kicker">{outcome?.label ?? "The end"}</p><p className="text-lg font-black">{node.endingTitle || "Story complete"}</p></div></div>
            <p className="whitespace-pre-wrap text-sm leading-7">{node.text}</p>
            <div className="rounded-xl bg-card p-3 text-sm ring-1 ring-[var(--tg-line)]">
              <p className="tg-kicker mb-1">Your path</p>
              <ol className="list-decimal space-y-0.5 pl-5">{path.map((text, i) => <li key={i}>{text}</li>)}</ol>
            </div>
            {node.outcome === "best" ? <p className="text-sm font-bold"><Ico name="trophy" className="mr-1.5 text-emerald-500" />You found the best ending — your choices applied the lesson well.</p>
              : best ? <div className="rounded-xl bg-emerald-500/10 p-3 text-sm ring-1 ring-emerald-500/40"><p className="mb-1 font-extrabold">The best path{bestNode?.endingTitle ? ` (“${bestNode.endingTitle}”)` : ""}</p><ol className="list-decimal space-y-0.5 pl-5">{best.map((text, i) => <li key={i}>{text}</li>)}</ol>{bestNode ? <p className="mt-1.5 text-muted-foreground">Why: {bestNode.text}</p> : null}</div>
              : <p className="text-sm text-muted-foreground">This story has {endings.length} endings — try another path to compare the outcomes.</p>}
            {data.takeaway ? <p className="text-sm"><strong>Lesson takeaway:</strong> {data.takeaway}</p> : null}
          </div>
      ) : <>
        <p className="mb-4 whitespace-pre-wrap text-sm leading-7">{node.text}</p>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--tg-ink)]">What do you do?</p>
        <div className="grid gap-2">{node.choices.map((choice, index) => <button key={index} type="button" className={button} onClick={() => setHistory([...decisions, index])}>{choice.text}</button>)}</div>
      </>}
    </> : <p role="alert">This story could not be opened.</p>}
    <DecisionControls count={decisions.length} score={ending ? `Ending reached in ${decisions.length} decision${decisions.length === 1 ? "" : "s"}` : `${decisions.length} decision${decisions.length === 1 ? "" : "s"} made`} onBack={() => setHistory(decisions.slice(0, -1))} onRestart={() => setHistory([])} />
  </Game>
}

const fmt = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
const signed = (delta) => `${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${fmt(Math.abs(delta))}`

/** One labelled resource bar; the dashed tick marks the minimum you must stay at or above. */
function ResourceBar({ resource, value, scale, target, threshold, preview }) {
  const pct = (v) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`
  const low = value - resource.minimum <= Math.max(1, scale * 0.1)
  return (
      <div className={`rounded-2xl border p-3 ${target ? "border-[var(--tg)] bg-[var(--tg-soft)]" : "border-[var(--tg-line)] bg-[var(--tg-softer)]"}`}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{resource.name}{target ? <Ico name="target" className="ml-1.5 text-[var(--tg)]" /> : null}</span>
          <span className="text-lg font-black tabular-nums">{fmt(value)}{preview != null && preview !== value ? <span className={`ml-1 text-sm ${preview > value ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>→ {fmt(preview)}</span> : null}</span>
        </div>
        <div className="relative mt-2 h-2.5 rounded-full bg-card ring-1 ring-[var(--tg-line)]">
          <span className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${low && !target ? "bg-rose-500" : "bg-[var(--tg)]"}`} style={{ width: pct(value) }} />
          {target ? <span className="absolute -top-1 -bottom-1 w-0.5 bg-emerald-600" style={{ left: pct(threshold) }} title={`Goal: ${fmt(threshold)}`} /> : null}
          {resource.minimum > 0 ? <span className="absolute -top-1 -bottom-1 w-0.5 bg-rose-500" style={{ left: pct(resource.minimum) }} /> : null}
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
          {target ? `Goal: reach ${fmt(threshold)} by the last round` : resource.description || `Can't drop below ${fmt(resource.minimum)}`}
          {target && resource.description ? ` · ${resource.description}` : ""}
        </p>
      </div>
  )
}

export function SimulationGame({ data }) {
  const [history, setHistory] = useTutorWidgetProgress("decisions", [])
  const [hover, setHover] = useState(null)
  const { values, decisions, feedback } = simulationState(data, history)
  const round = data.rounds[decisions.length]
  const target = data.targetResource, threshold = data.targetMinimum
  const success = values[target] >= threshold
  const stuck = round && !round.choices.some((choice) => applySimulationChoice(data.resources, values, choice))
  const finished = !round || stuck
  const before = decisions.length ? simulationState(data, decisions.slice(0, -1)).values : null
  const lastChoice = decisions.length ? data.rounds[decisions.length - 1].choices[decisions.at(-1)] : null
  const preview = hover != null && round ? applySimulationChoice(data.resources, values, round.choices[hover]) : null
  const roundsLeft = data.rounds.length - decisions.length
  const needed = Math.max(0, threshold - values[target])
  return <Game data={data}>
    <GameHint>Each round, pick the decision that moves you toward the goal without breaking a resource minimum.</GameHint>
    <p className="mb-3 text-sm"><Ico name="role" className="mr-1.5 text-[var(--tg)]" /><strong>{data.role || "Decision maker"}</strong>{data.goal ? ` — ${data.goal}` : ""}</p>
    <div className="mb-3 rounded-2xl bg-[var(--tg-soft)] p-3">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm font-extrabold">
        <span><Ico name="target" className="mr-1.5 text-[var(--tg)]" />{target}: {fmt(values[target])} / {fmt(threshold)}</span>
        <span className="text-xs text-muted-foreground">{finished ? "Game over" : `Round ${decisions.length + 1} of ${data.rounds.length} · ${roundsLeft} left`}</span>
      </div>
      <ProgressBar value={Math.min(values[target], threshold)} total={threshold || 1} label={`${target} progress toward the goal`} />
      {!finished ? <p className="mt-1.5 text-xs font-semibold text-muted-foreground">{needed > 0 ? `You need ${fmt(needed)} more ${target} in ${roundsLeft} round${roundsLeft === 1 ? "" : "s"}.` : "Goal reached — keep it there until the last round."}</p> : null}
    </div>
    <div className="mb-4 grid gap-2 sm:grid-cols-3">{data.resources.map((resource) => <ResourceBar key={resource.name} resource={resource} value={values[resource.name]} preview={preview?.[resource.name]} scale={Math.ceil(Math.max(1, resource.initial, values[resource.name], resource.name === target ? threshold : 0) * 1.15)} target={resource.name === target} threshold={threshold} />)}</div>
    {lastChoice ? <div role="status" className="mb-4 rounded-2xl border border-[var(--tg-line)] bg-card p-3 text-sm">
      <p className="tg-kicker mb-1">Last decision</p>
      <p className="font-extrabold">“{lastChoice.text}”</p>
      <div className="my-2 flex flex-wrap gap-1.5">{lastChoice.effects.length ? lastChoice.effects.map((effect) => <span key={effect.resource} className={`rounded-full px-2 py-0.5 text-xs font-bold ${effect.delta >= 0 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>{effect.resource}: {fmt(before[effect.resource])} → {fmt(values[effect.resource])} ({signed(effect.delta)})</span>) : <span className="text-xs text-muted-foreground">No resource change</span>}</div>
      {feedback ? <p className="leading-6"><Ico name="idea" className="mr-1.5 text-amber-500" />{feedback}</p> : null}
    </div> : null}
    {!finished ? <>
      <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-[var(--tg-ink)]">Round {decisions.length + 1}</p>
      <p className="mb-3 text-sm font-semibold leading-6">{round.situation}</p>
      <div className="grid gap-2">{round.choices.map((choice, index) => {
        const next = applySimulationChoice(data.resources, values, choice)
        const blocker = !next && data.resources.find((r) => values[r.name] + choice.effects.filter((e) => e.resource === r.name).reduce((sum, e) => sum + e.delta, 0) < r.minimum)
        return <button key={index} type="button" disabled={!next} className={button} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} onClick={() => { setHover(null); setHistory([...decisions, index]) }}>
          <span className="flex w-full flex-col gap-1.5">
            <span className="block">{choice.text.replace(/\s*\(([^)]*[+−-]\d[^)]*)\)\s*$/, "")}</span>
            <span className="flex flex-wrap gap-1.5">{choice.effects.length ? choice.effects.map((effect) => <span key={effect.resource} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${effect.resource === target ? "ring-1 ring-[var(--tg)] " : ""}${effect.delta >= 0 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>{effect.resource} {fmt(values[effect.resource])} → {fmt(values[effect.resource] + effect.delta)}</span>) : <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">No resource change</span>}</span>
            {blocker ? <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400"><Ico name="lock" className="mr-1" />Locked — would drop {blocker.name} below {fmt(blocker.minimum)}</span> : null}
          </span>
        </button>
      })}</div>
    </> : <div role="status" className={`tg-result flex animate-in fade-in zoom-in-95 flex-col items-center gap-2 p-5 text-center duration-500 ${success ? "" : "!border-rose-400/60"}`}>
      <Ico name={success ? "trophy" : stuck ? "blocked" : "down"} className={`tg-confetti size-11 ${success ? "text-[var(--tg)]" : "text-rose-500"}`} />
      <p className="text-lg font-black">{success ? 'Goal achieved!' : stuck ? 'Out of options' : 'Simulation complete—goal not reached.'}</p>
      <p className="text-sm">{target}: <strong>{fmt(values[target])}</strong> / target {fmt(threshold)}{stuck ? ` · every decision in round ${decisions.length + 1} would break a resource minimum` : ""}.</p>
      <p className="text-sm text-muted-foreground">{success ? "Your choices balanced the trade-offs well." : `You were ${fmt(needed)} ${target} short. Undo a few decisions and protect the resources you need later.`}</p>
      {data.takeaway ? <p className="mt-1 max-w-prose rounded-xl bg-card p-3 text-sm ring-1 ring-[var(--tg-line)]"><strong>Lesson takeaway:</strong> {data.takeaway}</p> : null}
    </div>}
    <DecisionControls count={decisions.length} score={`${target} ${fmt(values[target])} of ${fmt(threshold)} · round ${Math.min(decisions.length + 1, data.rounds.length)} of ${data.rounds.length}`} onBack={() => setHistory(decisions.slice(0, -1))} onRestart={() => setHistory([])} />
  </Game>
}

export function TwoTruthsLieGame({ data }) {
  const [position, setPosition] = useTutorWidgetProgress("round", 0)
  const [answers, setAnswers] = useTutorWidgetProgress("answers", {})
  const index = Math.max(0, Math.min(position, data.rounds.length - 1))
  const round = data.rounds[index], selected = answers[index]
  const answered = data.rounds.filter((_, i) => answers[i] != null).length
  const score = data.rounds.filter((entry, i) => answers[i] === entry.falseIndex).length
  return <Game data={data}><GameHint>Two statements are true. Choose the one that is false.</GameHint><div className="grid gap-2">{round.statements.map((statement, i) => <button key={i} type="button" className={`${button} ${selected != null && i === round.falseIndex ? 'is-right !opacity-100' : selected === i ? 'is-wrong !opacity-100' : ''}`} disabled={selected != null} onClick={() => setAnswers((current) => ({ ...current, [index]: i }))}><span className="tg-num mr-1">{String.fromCharCode(65 + i)}</span>{statement}{selected != null && i === round.falseIndex ? <span className="ml-2 text-xs font-semibold">The lie</span> : null}</button>)}</div>{selected != null ? <div role="status" className="mt-4 rounded-xl bg-muted p-3 text-sm"><p className="mb-1 font-semibold">{selected === round.falseIndex ? 'Correct—you found the lie!' : 'Not quite. Review the explanation.'}</p>{round.explanation}</div> : null}<StepNav prevLabel="Previous round" nextLabel="Next round" prevDisabled={index === 0} nextDisabled={selected == null || index === data.rounds.length - 1} onPrev={() => setPosition(index - 1)} onNext={() => setPosition(index + 1)}>Round {index + 1} of {data.rounds.length}</StepNav>{answered === data.rounds.length ? <Celebration right={score} total={data.rounds.length} noun="lies found" /> : null}<GameFooter score={`${score} of ${answered} correct · ${answered} of ${data.rounds.length} answered`} onRestart={() => { setAnswers({}); setPosition(0) }} /></Game>
}
