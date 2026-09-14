import { TopicBook } from "@/pages/learner/learning/learner-certification-curriculum-page.jsx"
import { BentoGrid, BentoSkeleton, BentoTile } from "@/components/commons/bento.jsx"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PenCircle, PenMark } from "@/components/classroom/pen-marks.jsx"
import { TeacherStamp } from "@/components/classroom/teacher-stamp.jsx"
import { AttemptFlipbook } from "@/components/classroom/attempt-flipbook.jsx"

/**
 * Dev-only: the portal's loading skeletons, held on screen so they can be
 * reviewed. They normally show for a few hundred milliseconds behind a login,
 * which is not long enough to look at. Routed only when `import.meta.env.DEV`.
 */
export default function SkeletonPreviewPage() {
  return (
    <div className="rebyu-ds netacad-portal learner-portal min-h-dvh">
      <main className="mx-auto max-w-6xl space-y-16 px-5 py-10">
        <section>
          <p className="rb-chalk-label mb-5">Learning path topics (books)</p>
          <div className="flex flex-wrap gap-10">
            {[
              ["locked", "locked", false],
              ["not started", "open", false],
              ["reading", "current", true],
              ["finished", "done", false],
            ].map(([label, state, reading]) => (
              <figure key={label} className="text-center">
                <div className="relative" style={{ width: 132, height: 116 }}>
                  <TopicBook
                    state={state}
                    reading={reading}
                    face={state === "locked" ? "var(--color-rb-swan)" : "var(--color-rb-feather)"}
                    lip={state === "locked" ? "var(--color-rb-hare)" : "var(--color-rb-feather-lip)"}
                  />
                </div>
                <figcaption className="mt-2 text-sm font-bold text-rb-wolf">{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section>
          <p className="rb-chalk-label mb-5">Bento tiles loading (analytics board)</p>
          <BentoGrid>
            <BentoTile col={4} row={2}>
              <BentoSkeleton rows={3} />
            </BentoTile>
            <BentoTile col={2} row={2}>
              <BentoSkeleton rows={2} />
            </BentoTile>
          </BentoGrid>
        </section>
        <section>
          <p className="rb-chalk-label mb-5">Marked paper, board dialog, bookmark toast</p>
          <div className="mb-6 flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button id="preview-open-dialog">Open a dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit assessment?</DialogTitle>
                  <DialogDescription>10 of 10 answered, nothing flagged.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total items</span><span>10</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">XP on completion</span><span>30-200 XP</span></div>
                  <Input placeholder="A note for your teacher" />
                </div>
                <DialogFooter>
                  <Button variant="outline">Review answers</Button>
                  <Button>Submit assessment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              id="preview-toast"
              variant="outline"
              onClick={() => toast.success("Assessment submitted", { description: "You had already earned the XP for this assessment." })}
            >
              Show a toast
            </Button>
          </div>

          <div className="space-y-4">
            <section className="rb-graded-sheet p-6 sm:p-8">
              <TeacherStamp passed={false} />
              <h1 className="rb-display rb-display-md pr-28 sm:pr-36">Management Principles Quiz</h1>
              <div className="mt-7 flex flex-col items-center gap-10 sm:flex-row sm:items-start">
                <div className="rb-grade-score is-fail">
                  <PenCircle />
                  <span className="rb-grade-score-value">10%</span>
                  <span className="rb-grade-score-note">not passed</span>
                  <span className="rb-grade-score-mark">pass mark 70%</span>
                </div>
                <dl className="grid flex-1 grid-cols-2 gap-3">
                  <div className="rb-grade-tally is-leaf"><dt>Correct</dt><dd>1</dd></div>
                  <div className="rb-grade-tally is-cardinal"><dt>Incorrect</dt><dd>9</dd></div>
                </dl>
              </div>
            </section>

            <div className="rb-graded-item is-incorrect">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-6 text-rb-eel">What is the final step in the PDCA cycle?</p>
                <span className="rb-graded-verdict"><PenMark kind="cross" /><span className="rb-pen">Incorrect</span></span>
              </div>
              <p className="mt-2 text-sm text-rb-wolf">Your answer:</p>
              <p className="rb-graded-answer">Check</p>
              <p className="rb-graded-correction"><span className="rb-graded-correction-label">Correct answer:</span>Act</p>
              <div className="rb-graded-note mt-2 text-sm"><p className="text-xs font-bold">Explanation</p><p>Act standardises what worked, or adjusts the plan.</p></div>
            </div>

            <ol className="space-y-3">
              {[["Attempt 3", "20%", false], ["Attempt 2", "80%", true]].map(([label, score, passed]) => (
                <li key={label}>
                  <div className="rb-graded-row flex flex-wrap items-center justify-between gap-4">
                    <span className="text-sm font-bold text-rb-eel">{label}</span>
                    <p className={passed ? "rb-grade-mini is-pass" : "rb-grade-mini is-fail"}>
                      <PenCircle />
                      <span>{score}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section>
          <p className="rb-chalk-label mb-5">Attempt flipbook</p>
          <AttemptFlipbook
            initialIndex={2}
            pages={[
              [1, 40, false],
              [2, 80, true],
              [3, 20, false],
            ].map(([n, pct, passed]) => ({
              key: n,
              tab: n,
              tone: passed ? "pass" : "fail",
              label: `Attempt ${n}`,
              content: (
                <div className="flex flex-col gap-6">
                  <div className="space-y-3">
                    <p className="rb-graded-heading">Attempt {n}</p>
                    <p className="rb-caption">Sep {n + 4}, 2026 · took 0m {10 + n}s</p>
                    <p className="rb-pen text-lg text-[#6b706c]">{pct / 10} / 10 points</p>
                  </div>
                  <div className={passed ? "rb-grade-score is-pass self-start" : "rb-grade-score is-fail self-start"}>
                    <PenCircle />
                    <span className="rb-grade-score-value">{pct}%</span>
                    <span className="rb-grade-score-note">{passed ? "passed" : "not passed"}</span>
                  </div>
                </div>
              ),
            }))}
          />
        </section>

      </main>
    </div>
  )
}
