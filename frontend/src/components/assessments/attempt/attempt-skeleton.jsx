import { LoadingSignal } from "@/components/loading-overlay.jsx"


const NAV_CELLS = 30

function Bar({ className = "" }) {
  return <div className={`rounded bg-rb-swan motion-safe:animate-pulse ${className}`} />
}

export default function AttemptSkeleton() {
  return <LoadingSignal />
}
