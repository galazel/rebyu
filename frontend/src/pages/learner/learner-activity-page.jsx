import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { TutorWidgets } from "@/components/learner/tutor-widgets.jsx"
import { LibraryItemShell } from "@/components/learner/library-item-shell.jsx"
import { getLibraryActivity } from "@/services/learnerToolsService.js"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"

/** A game or activity the AI tutor made in a lesson and saved to the Library. */
export default function LearnerActivityPage() {
  usePortalTheme()
  const { libraryItemId } = useParams()
  const query = useQuery({ queryKey: ["library-activity", libraryItemId], queryFn: () => getLibraryActivity(libraryItemId), retry: 1 })
  const activity = query.data?.data ?? query.data
  const widget = activity?.widget

  return (
    <div className="rebyu-ds netacad-portal min-h-screen bg-background text-foreground">
      <LibraryItemShell
        tool={widget?.variant || widget?.type}
        title={activity?.title}
        lessonTitle={activity?.lessonTitle}
        loading={query.isLoading}
        error={query.isError || (!query.isLoading && !widget) ? "This activity could not be opened." : null}
        onRetry={() => query.refetch()}
      >
        <TutorWidgets
          persistenceScope={`library:${libraryItemId}`}
          widgets={[{ ...widget, library: { id: libraryItemId, route: `/learner/activities/${libraryItemId}` } }]}
        />
      </LibraryItemShell>
    </div>
  )
}
