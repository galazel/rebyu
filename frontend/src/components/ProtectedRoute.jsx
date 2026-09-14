import { Navigate, Outlet } from "react-router-dom"

import { LoadingSignal } from "@/components/loading-overlay.jsx"
import { useAuth } from "@/context/auth-context.jsx"

function ProtectedRoute({ allowedRoles }) {
  const { user, status } = useAuth()

  if (status === "loading") {
    return <LoadingSignal />
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />
  }

  const role = (user?.role ?? "LEARNER").toUpperCase()
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
