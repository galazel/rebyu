import { useId, useMemo } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { BookOpen, Check, XCircle } from "@/components/icons"
import { useTutorWidgetProgress } from "@/hooks/useTutorWidgetProgress.js"
import { studyIndex, tutorStudyItems } from "@/lib/tutor-study-set.js"
import { categoryClass, Ico, Celebration, Confidence, FlipCard, GameIcon, IconButton, OPTION_COLORS, ProgressBar, StepNav } from "@/components/learner/tutor-game-kit.jsx"

function Text({ children }) {
  return <div className="break-words leading-relaxed [&_p]:my-1 [&_pre]:overflow-auto [&_ul]:list-disc [&_ul]:pl-5"><ReactMarkdown remarkPlugins={[remarkGfm]}>{String(children ?? "")}</ReactMarkdown></div>
}

export function TutorStudyWidget({ data }) {
  const items = useMemo(() => tutorStudyItems(data), [data])
  const [mode, setMode] = useTutorWidgetProgress("studyMode", data.type === "flashcards" ? "flashcards" : "quiz")
  const [position, setPosition] = useTutorWidgetProgress("index", 0)
  const [flashcardPosition, setFlashcardPosition] = useTutorWidgetProgress("flashcardIndex", data.type === "flashcards" ? position : 0)
  const [answers, setAnswers] = useTutorWidgetProgress("answers", {})
  const [flipped, setFlipped] = useTutorWidgetProgress("flipped", false)
  const [known, setKnown] = useTutorWidgetProgress("known", {})
  const [hint, setHint] = useTutorWidgetProgress("hint", false)
  const [finished, setFinished] = useTutorWidgetProgress("finished", false)
  const id = useId()
  const index = studyIndex(mode === "flashcards" ? flashcardPosition : position, items.length)
  const item = items[index]
  const picked = answers[index]
  const answered = items.filter((_, i) => answers[i] != null).length
  const right = items.filter((entry, i) => entry.options.length ? answers[i] === entry.correctIndex : answers[i] === true).length
  const knownCount = items.filter((_, i) => known[i]).length
  const reviewedCount = items.filter((_, i) => typeof known[i] === "boolean").length

  function go(next) { (mode === "flashcards" ? setFlashcardPosition : setPosition)(studyIndex(next, items.length)); setFlipped(false) }
  function chooseMode(next) { setMode(next); setFlipped(false) }
  function reset() { setAnswers({}); setPosition(0); setFlipped(false); setHint(false); setFinished(false) }
  function restartCards() { setKnown({}); setFlashcardPosition(0); setFlipped(false) }
  function rateCard(value) {
    if (!flipped) return
    const updated = { ...known, [index]: value }
    setKnown(updated)
    // Wrap past the last card to any unreviewed cards rather than silently getting stuck.
    const remaining = Array.from({ length: items.length }, (_, offset) => (index + offset + 1) % items.length).find((candidate) => typeof updated[candidate] !== "boolean")
    if (remaining != null) { setFlashcardPosition(remaining); setFlipped(false) }
  }

  if (!item) return <p role="status" className="p-4 text-sm text-muted-foreground">This study set has no questions or cards yet.</p>

  const quizDone = mode === "quiz" && finished && answered === items.length
  const lastQuestion = mode === "quiz" && index === items.length - 1
  const deckDone = mode === "flashcards" && reviewedCount === items.length
  const isRight = picked != null && (item.options.length ? picked === item.correctIndex : picked === true)

  return (
    <section data-tutor-study-set className={`tg-frame my-3 w-full min-w-0 ${categoryClass(data.type)}`} aria-label={data.title || "Practice study set"}>
      <header className="tg-head flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="tg-badge-icon"><GameIcon type={mode === "flashcards" ? "flashcards" : "quiz"} /></span>
        <span className="min-w-0 flex-1">
          <span className="tg-kicker block">{mode === "quiz" ? "Quiz" : "Flashcards"}</span>
          {data.title ? <span className="block truncate text-sm font-extrabold text-foreground">{data.title}</span> : null}
        </span>
        <div role="tablist" aria-label="Study mode" className="inline-flex rounded-full bg-card p-1 ring-1 ring-[var(--tg-line)]">
          {[['quiz', 'Quiz'], ['flashcards', 'Flashcards']].map(([value, label]) => <button key={value} id={`${id}-${value}`} type="button" role="tab" aria-selected={mode === value} aria-controls={`${id}-panel`} tabIndex={mode === value ? 0 : -1} onClick={() => chooseMode(value)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? "quiz" : event.key === "End" ? "flashcards" : mode === "quiz" ? "flashcards" : "quiz"; chooseMode(next); document.getElementById(`${id}-${next}`)?.focus() } }} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg)] ${mode === value ? "bg-[var(--tg)] text-white dark:text-[#10151a]" : "text-muted-foreground hover:text-foreground"}`}><GameIcon type={value} className="size-3" />{label}</button>)}
        </div>
        <Link to="/learner/library" className="tg-pill inline-flex items-center gap-1 hover:underline"><BookOpen className="size-3" />{data.library?.id != null ? "Saved" : "Library"}</Link>
      </header>
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1"><ProgressBar value={mode === "quiz" ? answered : reviewedCount} total={items.length} label={mode === "quiz" ? "Questions answered" : "Cards reviewed"} /></div>
          <span className="tg-pill">{mode === "quiz" ? `${right} correct` : `${knownCount} known`}</span>
        </div>
        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${mode}`}>
          {quizDone ? <Celebration right={right} total={items.length} onRestart={reset} restartLabel="Try again" />
            : deckDone ? <Celebration right={knownCount} total={items.length} noun="known" detail={`${items.length - knownCount} still learning`} onRestart={restartCards} restartLabel="Review again" />
            : mode === "quiz" ? (
            <>
              <div className="mb-4 rounded-2xl bg-[var(--tg-softer)] p-4 text-lg font-extrabold text-foreground ring-1 ring-[var(--tg-line)]"><Text>{item.front}</Text></div>
              {item.options.length ? <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-label="Answer choices">
                {item.options.map((option, optionIndex) => {
                  const correct = picked != null && optionIndex === item.correctIndex
                  const wrong = picked != null && picked === optionIndex && !correct
                  return <button key={optionIndex} type="button" disabled={picked != null} aria-pressed={picked === optionIndex} onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} style={{ "--opt": OPTION_COLORS[optionIndex % OPTION_COLORS.length] }} className={`tg-option ${correct ? "is-right" : wrong ? "is-wrong" : picked != null ? "is-dim" : ""}`}><span className="tg-letter">{correct ? <Check className="size-4" /> : wrong ? <XCircle className="size-4" /> : String.fromCharCode(65 + optionIndex)}</span><span className="min-w-0 flex-1"><Text>{option}</Text></span></button>
                })}
              </div> : <>
                <FlipCard flipped={flipped} onFlip={() => setFlipped(!flipped)} front="Recall the answer, then flip to check yourself." back={<Text>{item.back}</Text>} frontLabel="Think first" />
                {flipped && picked == null ? <Confidence missLabel="Still learning" hitLabel="I knew it" onMiss={() => setAnswers((current) => ({ ...current, [index]: false }))} onHit={() => setAnswers((current) => ({ ...current, [index]: true }))} /> : null}
              </>}
              {picked != null ? <div role="status" className={`mt-4 flex animate-in fade-in gap-3 rounded-2xl p-3 text-sm duration-300 ${isRight ? "bg-emerald-500/12 text-foreground ring-1 ring-emerald-500/40" : "bg-rose-500/10 text-foreground ring-1 ring-rose-500/40"}`}><Ico name={isRight ? "right" : "think"} className={`mt-0.5 size-6 ${isRight ? "text-emerald-500" : "text-rose-500"}`} /><div className="min-w-0"><p className="mb-1 font-extrabold">{isRight ? "Correct!" : "Keep practising."}</p>{item.options.length && picked !== item.correctIndex ? <Text>{`Answer: ${item.back}`}</Text> : null}{item.explanation ? <Text>{item.explanation}</Text> : null}</div></div> : null}
              {data.hint ? <div className="mt-3 flex items-start gap-2 text-sm"><IconButton icon={hint ? "hide" : "show"} label={hint ? "Hide hint" : "Show hint"} onClick={() => setHint(!hint)} />{hint ? <div className="pt-2"><Text>{data.hint}</Text></div> : null}</div> : null}
            </>
          ) : (
            <>
              <FlipCard flipped={flipped} onFlip={() => setFlipped(!flipped)} front={<Text>{item.front}</Text>} back={<><Text>{item.back}</Text>{item.explanation ? <span className="mt-2 block text-sm opacity-85"><Text>{item.explanation}</Text></span> : null}</>} />
              {flipped ? <Confidence onMiss={() => rateCard(false)} onHit={() => rateCard(true)} /> : null}
            </>
          )}
        </div>
        {quizDone || deckDone ? null : (
          <StepNav prevLabel={mode === "quiz" ? "Previous question" : "Previous card"} nextLabel={mode === "flashcards" && index === items.length - 1 ? "Back to first card" : lastQuestion ? "See results" : mode === "quiz" ? "Next question" : "Next card"}
                   prevDisabled={index === 0} nextDisabled={mode === "quiz" ? picked == null || (lastQuestion && answered < items.length) : items.length < 2}
                   onPrev={() => go(index - 1)} onNext={() => lastQuestion ? setFinished(true) : go(mode === "flashcards" ? (index + 1) % items.length : index + 1)}>
            {mode === "quiz" ? "Question" : "Card"} {index + 1} of {items.length}
          </StepNav>
        )}
      </div>
    </section>
  )
}
