import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, BookOpen } from "@/components/icons"
import { TutorWidgets } from "@/components/learner/tutor-widgets.jsx"
import { getLibraryActivity } from "@/services/learnerToolsService.js"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortalTheme } from "@/hooks/use-portal-theme.js"


export default function LearnerActivityPage() {
  usePortalTheme()
  const { libraryItemId } = useParams()
  const query = useQuery({ queryKey: ["library-activity", libraryItemId], queryFn: () => getLibraryActivity(libraryItemId), retry: 1 })
  const activity = query.data?.data ?? query.data
  return (
    <main className="rebyu-ds netacad-portal min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link to="/learner/library" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to Library
          </Link>
          {activity ? <h1 className="sr-only">{String(activity.title).replace(/^[a-z ]+:\s*/, "")}</h1> : null}{activity?.lessonTitle ? <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><BookOpen className="size-4" aria-hidden="true" /> From {activity.lessonTitle}</p> : null}
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-2 sm:px-8">
        {query.isLoading ? <Skeleton className="h-96 w-full rounded-xl" /> : query.isError || !activity?.widget ? (
          <div role="alert" className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm">This activity could not be opened.</p>
            <button type="button" className="mt-3 text-sm font-medium text-primary hover:underline" onClick={() => query.refetch()}>Try again</button>
          </div>
        ) : (
          <TutorWidgets persistenceScope={`library:${libraryItemId}`} widgets={[{ ...activity.widget, library: { id: libraryItemId, route: `/learner/activities/${libraryItemId}` } }]} />
        )}
      </div>
    </main>
  )
}
