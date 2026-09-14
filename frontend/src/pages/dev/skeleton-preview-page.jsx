import { PortalPageSkeleton } from "@/components/portal-page-skeleton.jsx"
import { TopicBook } from "@/pages/learner/learning/learner-certification-curriculum-page.jsx"
import { LearnerLoadingSkeleton } from "@/components/learner/learner-ui.jsx"
import { BentoGrid, BentoSkeleton, BentoTile } from "@/components/commons/bento.jsx"

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
          <p className="rb-chalk-label mb-5">PortalPageSkeleton (route fallback)</p>
          <PortalPageSkeleton />
        </section>

        <section>
          <p className="rb-chalk-label mb-5">LearnerLoadingSkeleton</p>
          <LearnerLoadingSkeleton />
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
      </main>
    </div>
  )
}
