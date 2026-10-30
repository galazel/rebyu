// Shared look for the AI tutor tools: each activity category has its own colour
// (see styles/tutor-games.css) and icon, and the drag games share one
// drag-and-drop helper that always has a click/tap fallback.
import { useContext, useEffect, useState } from "react"
import { TutorWidgetProgressContext } from "@/hooks/useTutorWidgetProgress.js"
import { writeWidgetField } from "@/lib/tutor-widget-progress.js"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TOOL_HELP } from "@/lib/learning-tool-help.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faListCheck, faCircleCheck, faObjectGroup, faListOl, faPenToSquare, faTableCells, faCircleQuestion, faShuffle,
  faCodeBranch, faCoins, faLink, faUserSecret, faLayerGroup, faStopwatch, faPuzzlePiece, faMagnifyingGlass,
  faGripVertical, faTable, faShapes, faShoePrints, faCode, faSquareRootVariable, faDiagramProject, faSliders,
  faBrain, faGamepad, faChevronLeft, faChevronRight, faRotateLeft, faCheck, faRepeat, faEye, faEyeSlash,
  faPlay, faPause, faEraser, faForwardFast, faListUl, faXmark, faReply, faCircleInfo, faTrophy, faMedal, faDumbbell, faBookOpen, faLightbulb, faHeart, faHeartCrack,
  faCircleXmark, faTriangleExclamation, faUserTie, faFlagCheckered, faBullseye, faCalendarDays, faLock, faArrowTrendDown, faBan,
  faCalculator, faMap, faStar, faFaceSmile,
} from "@fortawesome/free-solid-svg-icons"

export const CATEGORY_OF = {
  quiz: "recall", flashcards: "recall", true_false: "recall", fill_blank: "recall",
  sorting: "organize", ordering: "organize", matching: "organize",
  word_game: "word", crossword: "word", hangman: "word", unscramble: "word", word_search: "word", puzzle: "word", visual_game: "word",
  branching_story: "decision", simulation: "decision", two_truths_lie: "decision",
  speed_flashcards: "timed",
  table: "insight", diagram: "insight", mindmap: "insight", steps: "worked", math: "worked", code: "worked",
}

export const ACTIVITY_ICONS = {
  quiz: faListCheck, true_false: faCircleCheck, sorting: faObjectGroup, ordering: faListOl, fill_blank: faPenToSquare,
  crossword: faTableCells, hangman: faCircleQuestion, unscramble: faShuffle, word_search: faMagnifyingGlass, matching: faLink,
  branching_story: faCodeBranch, simulation: faCoins, two_truths_lie: faUserSecret, flashcards: faLayerGroup,
  speed_flashcards: faStopwatch, puzzle: faPuzzlePiece, jigsaw: faPuzzlePiece, sliding: faPuzzlePiece,
  visual_game: faMagnifyingGlass, hidden_objects: faMagnifyingGlass, spot_difference: faMagnifyingGlass,
  table: faTable, cards: faShapes, steps: faShoePrints, code: faCode, math: faSquareRootVariable,
  diagram: faDiagramProject, explorer: faSliders, mindmap: faBrain,
}

/** `tg-cat-*` class for a widget type (or a picker activity id). */
export function categoryClass(type) {
  return `tg-cat-${CATEGORY_OF[type] ?? "explain"}`
}

export function GameIcon({ type, className = "size-4" }) {
  return <FontAwesomeIcon icon={ACTIVITY_ICONS[type] ?? faGamepad} className={className} aria-hidden="true" />
}

export function Grip() {
  return <FontAwesomeIcon icon={faGripVertical} className="tg-grip size-3" aria-hidden="true" />
}

/** Native HTML5 drag-and-drop for cards plus a pick-then-place click fallback.
 *  `card(id)` spreads onto a draggable card, `zone(target)` onto a drop target;
 *  `onDrop(id, target)` runs for both a drop and a click on a target while a card is picked. */
export function useCardDrag(onDrop) {
  const [picked, setPicked] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [over, setOver] = useState(null)
  const place = (id, target) => { if (id == null) return; onDrop(id, target); setPicked(null); setDragging(null); setOver(null) }
  return {
    picked, setPicked, dragging, over,
    card: (id) => ({
      draggable: true,
      onDragStart: (event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(id)); setDragging(id) },
      onDragEnd: () => { setDragging(null); setOver(null) },
      onClick: () => setPicked((current) => current === id ? null : id),
      "aria-pressed": picked === id,
    }),
    zone: (target) => ({
      onDragOver: (event) => { event.preventDefault(); if (over !== target) setOver(target) },
      onDragLeave: (event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOver((current) => current === target ? null : current) },
      onDrop: (event) => { event.preventDefault(); place(dragging ?? event.dataTransfer.getData("text/plain"), target) },
    }),
    placePicked: (target) => place(picked, target),
  }
}

export const NAV_ICONS = {
  prev: faChevronLeft, next: faChevronRight, restart: faRotateLeft, check: faCheck, shuffle: faShuffle, flip: faRepeat,
  show: faEye, hide: faEyeSlash, play: faPlay, pause: faPause, clear: faEraser, all: faForwardFast, undo: faReply, list: faListUl,
}

/** Round icon button with an aria-label and a hover/focus tooltip. Pass `text` only when the icon alone would be ambiguous. */
export function IconButton({ icon, label, onClick, disabled, primary, text, className = "" }) {
  return (
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label} data-tip={label}
              className={`tg-btn tg-icon-btn ${text ? "tg-btn-wide" : ""} ${primary ? "tg-btn-primary" : ""} ${className}`}>
        <FontAwesomeIcon icon={NAV_ICONS[icon] ?? icon} className="size-4" aria-hidden="true" />{text ? <span>{text}</span> : null}
      </button>
  )
}

/** Previous ‹ counter › next — the same layout in every step-through widget. */
export function StepNav({ onPrev, onNext, prevDisabled, nextDisabled, prevLabel = "Previous", nextLabel = "Next", children }) {
  return (
      <div className="tg-nav mt-4">
        <IconButton icon="prev" label={prevLabel} onClick={onPrev} disabled={prevDisabled} />
        <span className="text-center" aria-live="polite"><span className="tg-pill">{children}</span></span>
        <IconButton icon="next" label={nextLabel} onClick={onNext} disabled={nextDisabled} primary={!nextDisabled} />
      </div>
  )
}

export const OPTION_COLORS = ["#2f7ee0", "#d6436b", "#d98a00", "#7c4ddb", "#1f9d74", "#e25c1c"]

/** A real 3D flip card: tap, Enter or Space flips it. */
export function FlipCard({ flipped, onFlip, front, back, frontLabel = "Question", backLabel = "Answer" }) {
  return (
      <button type="button" onClick={onFlip} aria-pressed={flipped} aria-label={flipped ? `Showing the ${backLabel.toLowerCase()}. Flip back` : `Showing the ${frontLabel.toLowerCase()}. Flip to see the ${backLabel.toLowerCase()}`}
              className={`tg-flip ${flipped ? "is-flipped" : ""}`}>
        <span className="tg-flip-inner">
          <span className="tg-face tg-face-front">
            <span className="tg-kicker">{frontLabel}</span>
            <span className="text-lg font-extrabold @md:text-xl">{front}</span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><FontAwesomeIcon icon={faRepeat} className="size-3" aria-hidden="true" />Tap or press Space to flip</span>
          </span>
          <span className="tg-face tg-face-back">
            <span className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">{backLabel}</span>
            <span className="text-base font-bold @md:text-lg">{back}</span>
          </span>
        </span>
      </button>
  )
}

/** Big red/green self-rating buttons, shown once the card is flipped. */
export function Confidence({ onMiss, onHit, missLabel = "Still learning", hitLabel = "Got it" }) {
  return (
      <div className="mt-4 grid animate-in fade-in slide-in-from-bottom-2 grid-cols-2 gap-3 duration-300">
        <button type="button" className="tg-conf tg-conf-miss" onClick={onMiss}><FontAwesomeIcon icon={faXmark} className="size-5" aria-hidden="true" />{missLabel}</button>
        <button type="button" className="tg-conf tg-conf-hit" onClick={onHit}><FontAwesomeIcon icon={faCheck} className="size-5" aria-hidden="true" />{hitLabel}</button>
      </div>
  )
}

export function ProgressBar({ value, total, label }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return <div className="tg-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><span style={{ width: `${pct}%` }} /></div>
}

/** End-of-round results: trophy, score ring, stars and a restart button.
 *  The score is saved with the game's progress (the Library shows it), and
 *  "Review answers" swaps the card for the finished game with its marks —
 *  or calls `onReview` for games that review some other way; `reviewable={false}` hides it. */
export function Celebration({ right, total, noun = "correct", detail, onRestart, restartLabel = "Play again", onReview, reviewable = true }) {
  const progressKey = useContext(TutorWidgetProgressContext)
  const [reviewing, setReviewing] = useState(false)
  useEffect(() => { if (progressKey && total) writeWidgetField(progressKey, "_score", { right, total }) }, [progressKey, right, total])
  const pct = total ? right / total : 0
  const stars = pct === 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0
  const ring = 2 * Math.PI * 34
  if (reviewing) {
    return (
        <div role="status" className="tg-result mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-extrabold">Score {right}/{total} <span className="font-semibold text-muted-foreground">· reviewing your answers</span></p>
          <button type="button" className="tg-btn" onClick={() => setReviewing(false)}>Back to results</button>
        </div>
    )
  }
  return (
      <div role="status" data-round-result className="tg-result flex animate-in fade-in zoom-in-95 flex-col items-center gap-3 px-4 py-6 text-center duration-500">
        <span className="tg-confetti text-5xl text-[var(--tg)]" aria-hidden="true"><Ico name={pct === 1 ? "trophy" : pct >= 0.7 ? "medal" : pct >= 0.4 ? "strong" : "book"} /></span>
        <p className="text-lg font-black">Completed!</p>
        <div className="relative grid size-24 place-items-center">
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--tg-soft)" strokeWidth="8" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--tg)" strokeWidth="8" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - pct)} className="transition-[stroke-dashoffset] duration-700" />
          </svg>
          <span className="text-xl font-black tabular-nums">{right}/{total}</span>
        </div>
        <p className="text-2xl tracking-widest text-amber-400" aria-label={`${stars} of 3 stars`}><Stars count={stars} /></p>
        <p className="text-sm font-semibold text-muted-foreground">{right} of {total} {noun}{detail ? ` · ${detail}` : ""}</p>
        <span className="flex flex-wrap justify-center gap-2">
          {reviewable ? <IconButton icon="show" text="Review answers" label="Review answers" onClick={() => (onReview ? onReview() : setReviewing(true))} /> : null}
          {onRestart ? <IconButton icon="restart" primary text={restartLabel} label={restartLabel} onClick={onRestart} /> : null}
        </span>
      </div>
  )
}

/** One instruction line under every game's heading. */
export function GameHint({ children }) { return <p className="mb-3 text-sm text-muted-foreground">{children}</p> }

/** The one control row every game ends with: Check answers · score · Restart. */
export function GameFooter({ onCheck, checkLabel = "Check answers", checkDisabled, score, onRestart, restartLabel = "Restart", restartDisabled, confirmRestart, children }) {
  const [confirming, setConfirming] = useState(false)
  return (
      <div data-game-footer className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--tg-line)] pt-3">
        {onCheck ? <button type="button" className="tg-btn tg-btn-primary" disabled={checkDisabled} onClick={onCheck}><Ico name="check" className="size-4" />{checkLabel}</button> : null}
        {children}
        {score ? <p role="status" aria-live="polite" className="text-sm font-semibold">{score}</p> : null}
        {confirming ? (
            <span role="alert" className="ml-auto flex flex-wrap items-center gap-2 text-xs font-semibold">{confirmRestart}
              <button type="button" className="tg-btn !border-transparent !bg-rose-500 !py-1 !text-xs !text-white" onClick={() => { setConfirming(false); onRestart() }}>Yes, {restartLabel.toLowerCase()}</button>
              <button type="button" className="tg-btn !py-1 !text-xs" onClick={() => setConfirming(false)}>Cancel</button>
            </span>
        ) : <button type="button" className="tg-btn ml-auto" disabled={restartDisabled} onClick={() => (confirmRestart ? setConfirming(true) : onRestart())}><Ico name="restart" className="size-4" />{restartLabel}</button>}
      </div>
  )
}

/** What the game is, how to play, how you win and what it teaches — from TOOL_HELP. */
export function HelpContent({ help }) {
  return (
      <div className="space-y-3 text-sm leading-6">
        <p>{help.what}</p>
        <div>
          <p className="tg-kicker mb-1">How to play</p>
          <ol className="space-y-1.5">{help.steps.map((step, i) => <li key={i} className="flex gap-2"><span className="tg-num !size-6 !text-[11px]">{i + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol>
        </div>
        <p><Ico name="trophy" className="mr-1.5 text-[var(--tg)]" /><strong>How you win:</strong> {help.win}</p>
        <p><Ico name="idea" className="mr-1.5 text-[var(--tg)]" /><strong>What it helps you learn:</strong> {help.learn}</p>
      </div>
  )
}

/** ⓘ button that opens a small how-to-play dialog for a picker tool (keyboard, touch and mouse). */
export function ToolInfoButton({ id, name }) {
  const help = TOOL_HELP[id]
  if (!help) return null
  return (
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" aria-label={`How to play ${name}`} data-tip="How to play"
                  className="tg-btn tg-icon-btn relative z-20 !size-8 !shadow-none">
            <FontAwesomeIcon icon={faCircleInfo} className="size-4 text-[var(--tg-ink)]" aria-hidden="true" />
          </button>
        </DialogTrigger>
        <DialogContent className={`max-h-[85dvh] overflow-y-auto sm:max-w-md ${categoryClass(id)}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3"><span className="tg-badge-icon"><GameIcon type={id} /></span>{name}</DialogTitle>
            <DialogDescription className="sr-only">How to play {name}</DialogDescription>
          </DialogHeader>
          <HelpContent help={help} />
        </DialogContent>
      </Dialog>
  )
}

const ICONS = {
  trophy: faTrophy, medal: faMedal, strong: faDumbbell, book: faBookOpen, idea: faLightbulb, heart: faHeart, heartLost: faHeartCrack,
  right: faCircleCheck, wrong: faCircleXmark, warning: faTriangleExclamation, role: faUserTie, finish: faFlagCheckered,
  target: faBullseye, rounds: faCalendarDays, lock: faLock, undo: faReply, down: faArrowTrendDown, blocked: faBan,
  calc: faCalculator, map: faMap, star: faStar, happy: faFaceSmile, think: faCircleQuestion,
}

/** Inline FontAwesome icon by short name — used instead of emoji everywhere in the tutor tools. */
export function Ico({ name, className = "" }) {
  return <FontAwesomeIcon icon={ICONS[name] ?? faCircleInfo} className={`inline-block ${className}`} aria-hidden="true" />
}

export function Stars({ count }) {
  return <span className="inline-flex gap-1">{[0, 1, 2].map((i) => <FontAwesomeIcon key={i} icon={faStar} className={`size-5 ${i < count ? "text-amber-400" : "text-muted-foreground/25"}`} aria-hidden="true" />)}</span>
}
