import { Link } from "react-router-dom"
import { ArrowLeft } from "@/components/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { categoryClass, GameIcon } from "@/components/learner/tutor-game-kit.jsx"

/** The page around a Library item (game, quiz or mind map): back link, icon and
 *  title, then the item itself on a wide centred stage with larger type — the
 *  same layout as the practice quiz and flashcard rounds. */
export function LibraryItemShell({ tool, title, lessonTitle, loading, error, onRetry, children }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <Link to="/learner/library" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-rb-feather-lip hover:underline">
        <ArrowLeft className="size-4" /> Library
      </Link>

      {loading ? (
        <>
          <Skeleton className="h-12 w-2/3 rounded-xl" />
          <Skeleton className="mt-4 h-[28rem] w-full rounded-[1.1rem]" />
        </>
      ) : error ? (
        <div role="alert" className="rounded-2xl border-2 border-rb-swan bg-card p-6">
          <p className="text-sm font-semibold text-foreground">{error}</p>
          {onRetry ? (
            <button type="button" className="mt-3 text-sm font-bold text-rb-feather-lip hover:underline" onClick={onRetry}>
              Try again
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <h1 className={`flex items-center gap-3 text-2xl font-extrabold text-foreground ${categoryClass(tool)}`}>
            <span className="tg-badge-icon !size-12"><GameIcon type={tool} className="size-5" /></span>
            <span className="min-w-0 font-rb-display">{String(title || "").replace(/^[a-z ]+:\s*/, "")}</span>
          </h1>
          {lessonTitle ? <p className="mt-1 text-sm font-semibold text-rb-hare">From {lessonTitle}</p> : null}
          <div className="tg-stage mt-4">{children}</div>
        </>
      )}
    </main>
  )
}
