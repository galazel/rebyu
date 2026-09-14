import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSignal } from "@/components/loading-overlay.jsx"

export function CertificationSkeletonCard({ size }) {
  /* Navigation waits show the one shared loading screen (LoadingSignal),
     not a page-shaped skeleton, so every wait in the app looks the same. */
  return <LoadingSignal />
}
