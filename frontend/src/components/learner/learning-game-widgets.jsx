import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useTutorWidgetProgress } from "@/hooks/useTutorWidgetProgress.js"
import { crossword, seededShuffle, slidingStart, wordSearch } from "@/lib/learning-games.js"
import { categoryClass, Ico, Celebration, Confidence, FlipCard, GameIcon, Grip, IconButton, StepNav, useCardDrag } from "@/components/learner/tutor-game-kit.jsx"

const button = "tg-btn"
export function Game({ data, children }) {
  const variant = data.variant || data.type
  return <section className={`tg-frame my-3 min-w-0 p-4 ${categoryClass(data.type)}`} data-learning-game={data.type} data-game-variant={variant}><header className="tg-head -m-4 mb-4 flex flex-wrap items-center justify-between gap-2 px-4 py-3"><h3 className="flex min-w-0 items-center gap-3 text-base font-extrabold"><span className="tg-badge-icon"><GameIcon type={variant} /></span><span className="min-w-0"><span className="tg-kicker block">{variant.replaceAll('_', ' ')}</span><span className="block truncate">{data.title || data.type.replaceAll('_', ' ')}</span></span></h3><Link to="/learner/library" className="tg-pill hover:underline">{data.library?.id ? "Saved to Library" : "Open Library"}</Link></header>{data.libraryError ? <p role="alert" className="mb-3 text-sm text-destructive">{data.libraryError}</p> : null}{children}</section>
}
function Result({ complete, children }) { return complete ? <p role="status" className="tg-result mt-4 flex animate-in fade-in zoom-in-95 items-center gap-3 p-3 text-sm font-medium duration-300"><Ico name="trophy" className="tg-confetti size-7 text-[var(--tg)]" /><span><strong className="block text-base font-extrabold">Completed!</strong>{children}</span></p> : null }

export function SortingGame({ data }) {
  const [assigned, setAssigned] = useTutorWidgetProgress("assigned", {})
  const [checked, setChecked] = useTutorWidgetProgress("checked", false)
  const items = useMemo(() => seededShuffle(data.groups.flatMap((group, answer) => group.items.map((text) => ({ text, answer })))), [data.groups])
  const move = (text, group) => { if (!items.some((item) => item.text === text)) return; setAssigned((current) => ({ ...current, [text]: group === "pool" ? null : group })); setChecked(false) }
  const drag = useCardDrag(move)
  const right = items.filter((item) => assigned[item.text] === item.answer).length
  const itemButton = (item) => <button type="button" key={item.text} {...drag.card(item.text)} className={`tg-card ${drag.picked === item.text ? "is-picked" : ""} ${drag.dragging === item.text ? "is-dragging" : ""} ${checked ? assigned[item.text] === item.answer ? "is-right" : "is-wrong" : ""}`}><Grip />{item.text}</button>
  const pool = items.filter((item) => assigned[item.text] == null)
  return <Game data={data}><p className="mb-3 text-sm text-muted-foreground">Drag each card into a group, or tap a card and then tap its group.</p><div className={`tg-zone mb-4 flex min-h-16 flex-wrap gap-2 p-3 ${drag.over === "pool" ? "is-over" : ""}`} {...drag.zone("pool")}>{pool.length ? pool.map(itemButton) : <span className="m-auto text-xs font-semibold text-muted-foreground">All cards placed — check your groups!</span>}</div><div className="grid gap-3 sm:grid-cols-2">{data.groups.map((group, index) => <div key={group.name} className={`tg-zone min-h-32 p-3 ${drag.over === index ? "is-over" : ""}`} {...drag.zone(index)}><button type="button" className={`${button} mb-3 w-full ${drag.picked != null ? "tg-btn-primary" : ""}`} onClick={() => drag.placePicked(index)} aria-label={`Place selected item in ${group.name}`}>{group.name}</button><div className="flex flex-wrap gap-2">{items.filter((item) => assigned[item.text] === index).map(itemButton)}</div></div>)}</div><div className="mt-4 flex gap-2"><IconButton icon="check" primary label="Check groups" onClick={() => setChecked(true)} /><IconButton icon="restart" label="Reset" onClick={() => { setAssigned({}); setChecked(false); drag.setPicked(null) }} /></div>{checked ? <p role="status" className="mt-3 text-sm font-semibold">{right} of {items.length} correctly grouped.</p> : null}<Result complete={checked && right === items.length}>{data.explanation}</Result></Game>
}

export function WordGame({ data }) {
  const [index, setIndex] = useTutorWidgetProgress("wordIndex", 0)
  const [answers, setAnswers] = useTutorWidgetProgress("wordAnswers", {})
  const [guesses, setGuesses] = useTutorWidgetProgress("guesses", {})
  const [found, setFound] = useTutorWidgetProgress("found", [])
  const [letters, setLetters] = useTutorWidgetProgress("letters", {})
  const [checked, setChecked] = useTutorWidgetProgress("wordChecked", false)
  const [start, setStart] = useState(null)
  const search = useMemo(() => wordSearch(data.words), [data.words])
  const cross = useMemo(() => crossword(data.words), [data.words])
  const entry = data.words[Math.min(index, data.words.length - 1)]
  const guessed = guesses[index] || ""
  const wrong = [...guessed].filter((letter) => !entry.word.includes(letter)).length
  const solved = [...entry.word].every((letter) => guessed.includes(letter))
  function selectCell(key) {
    if (!start) { setStart(key); return }
    const match = search.placements.find((placement) => (placement.cells[0] === start && placement.cells.at(-1) === key) || (placement.cells[0] === key && placement.cells.at(-1) === start))
    if (match && !found.includes(match.word)) setFound([...found, match.word])
    setStart(null)
  }
  const completeCross = Object.entries(cross.cells).every(([key, cell]) => letters[key] === cell.letter)
  return <Game data={data}>
    {data.variant === "word_search" ? <><p className="mb-3 text-sm text-muted-foreground">Choose the first and last letter of a word. Words may run forwards or backwards.</p><div className="mx-auto grid max-w-md gap-0.5" style={{ gridTemplateColumns: `repeat(${search.size}, minmax(0,1fr))` }}>{search.grid.flatMap((row, r) => row.map((letter, c) => { const key = `${r}:${c}`, marked = search.placements.some((word) => found.includes(word.word) && word.cells.includes(key)); return <button type="button" key={key} aria-label={`Row ${r + 1} column ${c + 1}: ${letter}`} className={`aspect-square rounded-md text-[clamp(9px,2vw,14px)] font-extrabold transition ${marked ? "bg-[var(--tg)] text-white dark:text-[#10151a]" : start === key ? "bg-[var(--tg-soft)] ring-2 ring-[var(--tg)]" : "bg-[var(--tg-softer)] hover:bg-[var(--tg-soft)]"}`} onClick={() => selectCell(key)}>{letter}</button> }))}</div><ul className="mt-3 space-y-1 text-sm">{data.words.map((word) => <li key={word.word} className={found.includes(word.word) ? "font-semibold text-[var(--tg-ink)] line-through" : ""}>{word.word} — {word.clue}</li>)}</ul><Result complete={found.length === data.words.length} /></> : null}
    {data.variant === "crossword" ? <><div className="max-w-full overflow-auto pb-2"><div className="mx-auto grid w-max gap-0.5 rounded-xl bg-[var(--tg-soft)] p-1.5" style={{ gridTemplateColumns: `repeat(${cross.maxCol - cross.minCol + 1}, 32px)` }}>{Array.from({ length: cross.maxRow - cross.minRow + 1 }, (_, row) => Array.from({ length: cross.maxCol - cross.minCol + 1 }, (_, col) => { const key = `${row + cross.minRow}:${col + cross.minCol}`, cell = cross.cells[key]; return cell ? <label key={key} className="tg-cross-cell relative size-8 rounded-[5px]"><span className="absolute top-0 left-0.5 text-[7px] text-muted-foreground">{cell.number || ""}</span><input maxLength={1} aria-label={`Crossword row ${row + 1} column ${col + 1}`} value={letters[key] || ""} onChange={(e) => { setLetters((current) => ({ ...current, [key]: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })); setChecked(false) }} className={`size-full rounded-[5px] border-2 bg-transparent pt-1 text-center text-sm font-extrabold uppercase outline-none focus:border-[var(--tg)] ${checked ? letters[key] === cell.letter ? "border-emerald-500" : "border-rose-500" : "border-transparent"}`} /></label> : <span key={key} className="size-8" /> }))}</div></div><ol className="my-3 grid gap-2 text-sm sm:grid-cols-2">{cross.placed.map((word) => <li key={word.word} className="flex gap-2 rounded-xl bg-[var(--tg-softer)] p-2"><span className="tg-num">{word.number}</span><span><strong className="text-xs uppercase text-[var(--tg-ink)]">{word.direction}</strong><span className="block">{word.clue} ({word.word.length})</span></span></li>)}</ol><IconButton icon="check" primary label="Check crossword" onClick={() => setChecked(true)} /><Result complete={checked && completeCross} /></> : null}
    {["hangman", "unscramble"].includes(data.variant) ? <><p className="mb-3 flex gap-2 rounded-xl bg-[var(--tg-softer)] p-3 text-sm"><Ico name="idea" className="mt-0.5 text-amber-500" /><span><strong className="tg-kicker block">Clue</strong>{entry.clue}</span></p>{data.variant === "hangman" ? <><svg viewBox="0 0 160 120" className="mx-auto h-36 text-[var(--tg-ink)]" aria-label={`${wrong} of 6 incorrect guesses`}><path d="M10 110H90M35 110V10H110V25M35 30L55 10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />{wrong > 0 ? <circle cx="110" cy="36" r="11" fill="none" stroke="currentColor" strokeWidth="3" /> : null}{["M110 47V78", "M110 54L92 68", "M110 54L128 68", "M110 78L94 100", "M110 78L126 100"].map((path, i) => wrong > i + 1 ? <path key={path} d={path} stroke="currentColor" strokeWidth="3" /> : null)}</svg><p className="my-4 flex flex-wrap justify-center gap-1.5" aria-label={[...entry.word].map((letter) => guessed.includes(letter) || wrong >= 6 ? letter : '_').join(' ')}>{[...entry.word].map((letter, i) => <span key={i} aria-hidden="true" className={`tg-tile ${guessed.includes(letter) ? "" : wrong >= 6 ? "is-reveal" : "is-blank"}`}>{guessed.includes(letter) || wrong >= 6 ? letter : "_"}</span>)}</p><div className="mb-3 flex justify-center gap-1" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <Ico key={i} name={i < 6 - wrong ? "heart" : "heartLost"} className={`size-5 ${i < 6 - wrong ? "text-rose-500" : "text-muted-foreground/30"}`} />)}</div><div className="flex flex-wrap justify-center gap-1">{[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => <button type="button" key={letter} disabled={guessed.includes(letter) || solved || wrong >= 6} className={`tg-key ${guessed.includes(letter) ? entry.word.includes(letter) ? "is-hit" : "is-miss" : ""}`} onClick={() => setGuesses((current) => ({ ...current, [index]: guessed + letter }))}>{letter}</button>)}</div><p role="status" className="mt-3 text-center text-sm font-bold">{solved ? "Correct!" : wrong >= 6 ? `Answer: ${entry.word}` : `${6 - wrong} guesses left`}</p></> : <><p className="mb-4 flex flex-wrap justify-center gap-1.5" aria-label={seededShuffle([...entry.word], index + 17).join(' ')}>{seededShuffle([...entry.word], index + 17).map((letter, i) => <span key={i} aria-hidden="true" className="tg-tile" style={{ transform: `rotate(${(i % 3 - 1) * 4}deg)` }}>{letter}</span>)}</p><input aria-label="Unscrambled word" value={answers[index] || ''} onChange={(e) => setAnswers((current) => ({ ...current, [index]: e.target.value.toUpperCase() }))} className="w-full rounded-xl border-2 border-[var(--tg-line)] bg-background p-3 text-center font-mono text-lg font-extrabold tracking-[0.3em] uppercase outline-none focus:border-[var(--tg)]" /><p role="status" className="mt-3 text-center text-sm font-bold">{answers[index]?.trim() === entry.word ? "Correct!" : "Use the clue to unscramble the letters."}</p></>}<StepNav prevLabel="Previous word" nextLabel="Next word" prevDisabled={index === 0} nextDisabled={index === data.words.length - 1} onPrev={() => setIndex(index - 1)} onNext={() => setIndex(index + 1)}>Word {index + 1} of {data.words.length}</StepNav></> : null}
    <div className="mt-4 flex justify-end"><IconButton icon="restart" label="Restart game" onClick={() => { setAnswers({}); setGuesses({}); setFound([]); setLetters({}); setChecked(false); setIndex(0); setStart(null) }} /></div>
  </Game>
}

function Diagram({ labels, viewBox = "0 0 300 300" }) {
  return <svg viewBox={viewBox} className="size-full" aria-hidden="true">{labels.map((label, i) => { const x = i % 3 * 100, y = Math.floor(i / 3) * 100; return <g key={i}><rect x={x + 3} y={y + 3} width="94" height="94" rx="12" fill={['#e3f1e9','#fff1d7','#e5edf9'][i % 3]} /><circle cx={x + 50} cy={y + 30} r="15" fill="#2f6b4f" /><text x={x + 50} y={y + 35} textAnchor="middle" fontSize="13" fill="white">{i + 1}</text><foreignObject x={x + 7} y={y + 53} width="86" height="42"><div xmlns="http://www.w3.org/1999/xhtml" style={{ color: '#123126', fontSize: 10, textAlign: 'center', lineHeight: '12px', overflowWrap: 'anywhere' }}>{label}</div></foreignObject></g> })}</svg>
}

export function PuzzleGame({ data }) {
  const [tiles, setTiles] = useTutorWidgetProgress("tiles", () => data.variant === "sliding" ? slidingStart() : seededShuffle(Array.from({ length: 9 }, (_, i) => i)))
  const [moves, setMoves] = useTutorWidgetProgress("moves", 0)
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(false)
  const complete = tiles.every((value, i) => value === i)
  function swap(a, b) { if (a === b || a == null || b == null) return; const next = [...tiles]; [next[a], next[b]] = [next[b], next[a]]; setTiles(next); setSelected(null); setMoves(moves + 1) }
  function choose(index) {
    if (complete) return
    if (data.variant === "sliding") { const blank = tiles.indexOf(8); if (Math.abs(Math.floor(blank / 3) - Math.floor(index / 3)) + Math.abs(blank % 3 - index % 3) === 1) swap(index, blank) }
    else if (selected == null) setSelected(index); else swap(selected, index)
  }
  return <Game data={data}><p className="mb-3 text-sm text-muted-foreground">{data.variant === "sliding" ? "Slide a neighboring tile into the empty space to restore the concept diagram." : "Drag pieces, or select two pieces to swap them and restore the concept diagram."}</p><div className="mx-auto grid max-w-sm grid-cols-3 gap-1.5 rounded-2xl bg-[var(--tg-soft)] p-1.5">{tiles.map((tile, index) => <button key={index} type="button" draggable={data.variant === "jigsaw"} onDragStart={() => setSelected(index)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (data.variant === "jigsaw") swap(selected, index) }} aria-label={tile === 8 && data.variant === "sliding" && !complete ? "Empty space" : `Piece ${tile + 1} at position ${index + 1}`} onClick={() => choose(index)} className={`aspect-square overflow-hidden rounded-lg bg-background shadow-[0_3px_0_var(--tg-line)] transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--tg)] ${selected === index ? "ring-4 ring-[var(--tg)]" : ""}`}>{tile !== 8 || data.variant !== "sliding" || complete ? <Diagram labels={data.labels} viewBox={`${tile % 3 * 100} ${Math.floor(tile / 3) * 100} 100 100`} /> : null}</button>)}</div><p className="mt-3 text-center"><span className="tg-pill">{moves} moves</span></p><div className="mt-3 flex gap-2"><IconButton icon={preview ? "hide" : "show"} label={preview ? "Hide reference" : "Show reference"} onClick={() => setPreview(!preview)} /><IconButton icon="restart" label="Restart puzzle" onClick={() => { setTiles(data.variant === 'sliding' ? slidingStart() : seededShuffle(Array.from({ length: 9 }, (_, i) => i), moves + 27)); setMoves(0); setSelected(null) }} /></div>{preview ? <div className="mx-auto mt-4 max-w-xs"><Diagram labels={data.labels} /></div> : null}<Result complete={complete}>{data.explanation}</Result></Game>
}

export function VisualGame({ data }) {
  const [found, setFound] = useTutorWidgetProgress("found", [])
  const [notice, setNotice] = useState('')
  function find(label) { if (!data.targets.includes(label)) { setNotice("Look closely—try another object."); return } if (!found.includes(label)) setFound([...found, label]); setNotice('Found it!') }
  const scene = (changed) => <div className="grid grid-cols-4 gap-2 rounded-2xl bg-[var(--tg-softer)] p-3 ring-1 ring-[var(--tg-line)]">{Array.from({ length: 16 }, (_, position) => { const object = data.objects.find((entry) => entry.position === position); return object ? <button type="button" key={position} disabled={!changed && data.variant === 'spot_difference'} aria-label={`${changed ? 'Find' : 'Reference'} ${object.label}`} onClick={() => find(object.label)} className={`grid aspect-square place-items-center rounded-xl border text-3xl sm:text-4xl transition ${found.includes(object.label) ? "border-emerald-500 bg-emerald-500/15" : "border-transparent bg-card hover:scale-105 hover:border-[var(--tg)]"}`}>{changed && object.changedSymbol ? object.changedSymbol : object.symbol}</button> : <span key={position} className="aspect-square rounded-xl bg-background/50" /> })}</div>
  return <Game data={data}><p className="mb-3 text-sm text-muted-foreground">{data.variant === 'spot_difference' ? "Compare the two illustrated scenes and select changed objects in the second scene." : "Find the listed objects in the illustrated scene."}</p><div className={`grid gap-4 ${data.variant === 'spot_difference' ? 'lg:grid-cols-2' : ''}`}>{data.variant === 'spot_difference' ? <div><p className="mb-2 text-xs font-semibold">Original</p>{scene(false)}</div> : null}<div>{data.variant === 'spot_difference' ? <p className="mb-2 text-xs font-semibold">Find the differences</p> : null}{scene(true)}</div></div>{data.variant === 'hidden_objects' ? <ul className="mt-3 flex flex-wrap gap-2">{data.targets.map((target) => <li key={target} className={`tg-chip !text-xs ${found.includes(target) ? 'line-through opacity-60' : ''}`}>{target}</li>)}</ul> : null}<p aria-live="polite" className="mt-3 text-sm">{found.length}/{data.targets.length} found. {notice}</p><IconButton icon="restart" label="Restart game" className="mt-3" onClick={() => { setFound([]); setNotice('') }} /><Result complete={found.length === data.targets.length}>{data.explanation}</Result></Game>
}

export function SpeedFlashcardsGame({ data }) {
  const [index, setIndex] = useTutorWidgetProgress("speedIndex", 0)
  const [remaining, setRemaining] = useTutorWidgetProgress("remaining", data.seconds || 15)
  const [flipped, setFlipped] = useTutorWidgetProgress("speedFlipped", false)
  const [ratings, setRatings] = useTutorWidgetProgress("speedRatings", {})
  const [running, setRunning] = useState(false)
  const card = data.cards[Math.min(index, data.cards.length - 1)]
  const complete = Object.keys(ratings).length === data.cards.length
  useEffect(() => {
    if (!running || flipped || complete) return
    const started = Date.now(), budget = remaining
    const tick = setInterval(() => { const next = Math.max(0, budget - Math.floor((Date.now() - started) / 1000)); setRemaining(next); if (next === 0) { setFlipped(true); setRunning(false) } }, 200)
    return () => clearInterval(tick)
  }, [running, flipped, complete, index, setRemaining, setFlipped]) // budget is captured when starting/resuming a card
  function rate(value) { setRatings((current) => ({ ...current, [index]: value })); if (index < data.cards.length - 1) { setIndex(index + 1); setRemaining(data.seconds || 15); setFlipped(false) } else setRunning(false) }
  function goTo(next) { setIndex(next); setRemaining(data.seconds || 15); setFlipped(false); setRunning(false) }
  function restart() { setIndex(0); setRemaining(data.seconds || 15); setFlipped(false); setRatings({}); setRunning(false) }
  const total = data.seconds || 15
  const ring = 2 * Math.PI * 20
  return <Game data={data}>{complete ? <Celebration right={Object.values(ratings).filter(Boolean).length} total={data.cards.length} noun="recalled" onRestart={restart} restartLabel="Restart round" /> : <>
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="relative grid size-14 place-items-center" role="timer" aria-label="Seconds remaining">
        <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="none" stroke="var(--tg-soft)" strokeWidth="5" /><circle cx="24" cy="24" r="20" fill="none" stroke={remaining <= 5 ? "#e0475f" : "var(--tg)"} strokeWidth="5" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - remaining / total)} className="transition-[stroke-dashoffset] duration-300" /></svg>
        <span className={`text-base font-black tabular-nums ${remaining <= 5 && running ? "animate-pulse text-rose-500" : ""}`}>{remaining}s</span>
      </div>
      <div className="flex gap-2"><IconButton icon={running ? "pause" : "play"} primary={!running} label={running ? 'Pause timer' : 'Start timer'} disabled={flipped || remaining === 0} onClick={() => setRunning(!running)} /><IconButton icon="restart" label="Restart round" onClick={restart} /></div>
    </div>
    <FlipCard flipped={flipped} onFlip={() => { setFlipped(!flipped); setRunning(false) }} front={card.front} back={card.back} />
    {flipped ? <Confidence onMiss={() => rate(false)} onHit={() => rate(true)} /> : <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">Start the timer, recall the answer, then flip the card.</p>}
    <StepNav prevLabel="Previous card" nextLabel="Next card" prevDisabled={index === 0} nextDisabled={index === data.cards.length - 1} onPrev={() => goTo(index - 1)} onNext={() => goTo(index + 1)}>Card {index + 1} of {data.cards.length}</StepNav>
  </>}</Game>
}
