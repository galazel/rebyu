import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Loader2 } from "@/components/icons"
import { MindMapWidget } from "@/components/learner/tutor-widgets.jsx"
import { getTutorMindMap } from "@/services/learnerToolsService.js"

/** A mind map the AI tutor made in a lesson chat and saved to the Library. */
export default function LearnerMindMapPage() {
  const { libraryItemId } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tutor-mind-map", libraryItemId],
    queryFn: () => getTutorMindMap(libraryItemId),
  })
  const map = data?.data ?? data

  return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <Link to="/learner/library" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-rb-feather-lip hover:underline">
          <ArrowLeft className="size-4" /> Library
        </Link>
        {isLoading ? (
            <div className="grid h-64 place-items-center"><Loader2 className="size-6 animate-spin text-rb-feather" /></div>
        ) : isError || !map?.widget ? (
            <p className="rounded-2xl border-2 border-rb-swan bg-white p-6 text-sm font-semibold text-rb-eel">This mind map could not be found.</p>
        ) : (
            <>
              <h1 className="text-2xl font-extrabold text-rb-eel">{map.title}</h1>
              {map.lessonTitle ? <p className="mt-1 text-sm font-semibold text-rb-hare">From {map.lessonTitle}</p> : null}
              <MindMapWidget data={{ ...map.widget, standalone: true }} />
            </>
        )}
      </main>
  )
}
