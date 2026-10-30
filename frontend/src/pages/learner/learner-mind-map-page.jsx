import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { MindMapWidget } from "@/components/learner/tutor-widgets.jsx"
import { LibraryItemShell } from "@/components/learner/library-item-shell.jsx"
import { getTutorMindMap } from "@/services/learnerToolsService.js"

/** A mind map the AI tutor made in a lesson chat and saved to the Library. */
export default function LearnerMindMapPage() {
  const { libraryItemId } = useParams()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tutor-mind-map", libraryItemId],
    queryFn: () => getTutorMindMap(libraryItemId),
  })
  const map = data?.data ?? data

  return (
    <LibraryItemShell
      tool="mindmap"
      title={map?.title}
      lessonTitle={map?.lessonTitle}
      loading={isLoading}
      error={isError || (!isLoading && !map?.widget) ? "This mind map could not be found." : null}
      onRetry={() => refetch()}
    >
      <MindMapWidget data={{ ...map?.widget, standalone: true }} />
    </LibraryItemShell>
  )
}
