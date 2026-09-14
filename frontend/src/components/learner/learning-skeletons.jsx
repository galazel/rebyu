import { LoadingSignal } from "@/components/loading-overlay.jsx"

/**
 * Loading shapes for the two full-bleed learning screens.
 *
 * The learner layout shows one skeleton while its portal query is in flight,
 * and it was the dashboard's: four stat tiles, a wide block, two panels. On
 * the dashboard that is the truth. On the topic and curriculum routes -- which
 * take `!max-w-none !gap-0 !p-0` so the page can run wall to wall -- it
 * rendered as unpadded grey slabs bleeding off every edge of the window, which
 * reads as a broken page rather than a loading one.
 *
 * So the shapes live here, where the layout can pick the one that matches the
 * route it is about to show, and the topic page can use the same one for its
 * own `isLoading` state instead of keeping a second copy in step by hand.
 *
 * Every shape holds the real geometry of the page it stands in for. That is
 * the whole job: the content should fill the frame in, not replace it, so
 * arriving is not a jump.
 */

const BLOCK = "animate-pulse rounded-rb-tile bg-rb-swan"

/**
 * A run of prose: a heading and the lines under it, a few times over.
 *
 * Exported because the topic page shows this on its own while one section's
 * body is fetched, with the rest of the page already painted.
 */
export function SectionStackSkeleton({ count = 3 }) {
  return (
    <div className="space-y-10">
      {Array.from({ length: count }, (_, section) => (
        <div key={section} className="space-y-3">
          <div className={`${BLOCK} h-6 w-1/2 max-w-sm`} />
          <div className={`${BLOCK} h-4 w-full`} />
          <div className={`${BLOCK} h-4 w-full`} />
          <div className={`${BLOCK} h-4 w-4/5`} />
        </div>
      ))}
    </div>
  )
}

/**
 * The topic page: outline rail, lesson header, section stack.
 *
 * Deliberately the two-column shape, never the three-column one: the tutor
 * panel is only offered on a lesson and only once the learner has opened it,
 * so a third column here would collapse the moment the real page rendered.
 */
export function TopicPageSkeleton() {
  /* Navigation waits show the one shared loading screen (LoadingSignal),
     not a page-shaped skeleton, so every wait in the app looks the same. */
  return <LoadingSignal />
}

/** Where each stop sits, as a fraction of the road's width. */
const STOP_OFFSETS = [0.5, 0.68, 0.5, 0.32, 0.5]

/**
 * The curriculum page: the progress strip, a unit banner, and the road.
 *
 * The stops zigzag the way the real path does rather than stacking in a
 * column -- a straight line of five identical blocks would resolve into a
 * winding road, and a layout that rearranges itself on arrival is the jump
 * this exists to avoid.
 */
export function CurriculumPageSkeleton() {
  /* Navigation waits show the one shared loading screen (LoadingSignal),
     not a page-shaped skeleton, so every wait in the app looks the same. */
  return <LoadingSignal />
}
