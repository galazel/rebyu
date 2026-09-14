import { LoadingSignal } from "@/components/loading-overlay.jsx"

/**
 * The attempt screen, before the server has said what is on the paper.
 *
 * This traces the real layout rather than showing a boot animation, so the
 * moment the attempt arrives is a fill-in rather than a re-layout: the same
 * 64px header with the same clusters left and right, the same padded workspace,
 * the same 288px navigator down the right, the same footer bar. Nothing moves
 * when the content lands -- it simply gains its words.
 *
 * The workspace is drawn as one panel rather than as the three-column diagram
 * or programming split, because at this point nothing knows what the first
 * question's type is. Guessing wrong would produce exactly the re-layout the
 * skeleton exists to avoid, and every layout begins with a panel in that
 * position anyway.
 *
 * The navigator grid is five across, which is what the real one is fixed at.
 */

const NAV_CELLS = 30

function Bar({ className = "" }) {
  return <div className={`rounded bg-rb-swan motion-safe:animate-pulse ${className}`} />
}

export default function AttemptSkeleton() {
  /* Navigation waits show the one shared loading screen (LoadingSignal),
     not a page-shaped skeleton, so every wait in the app looks the same. */
  return <LoadingSignal />
}
