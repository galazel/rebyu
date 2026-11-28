import { Navigate, Outlet, useLocation } from "react-router-dom"

import { LoadingSignal } from "@/components/loading-overlay.jsx"
import { roleHomePath, useAuth } from "@/context/auth-context.jsx"

function ProtectedRoute({ allowedRoles }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return <LoadingSignal />
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />
  }

  // No role yet means the identity is still resolving, not that this is a learner.
  // Guessing LEARNER here sent a brand-new institution owner or department head to
  // /learner/analytics (roleHomePath's fallback) seconds after finishing setup.
  const role = String(user?.role ?? "").toUpperCase()
  if (!role) {
    return <LoadingSignal />
  }

  if (!allowedRoles.includes(role)) {
    // A signed-in person outside their role's area goes to their own home, not /403.
    // This matters when the role changes mid-session (a new sign-up redeeming a
    // department head code, or finishing institution setup): React Router runs the
    // follow-up navigate() as a transition, so the new role renders first, still on
    // the old role's page, and a /403 redirect here would win over that navigation.
    const home = roleHomePath(role)
    if (!location.pathname.startsWith(home)) {
      return <Navigate to={home} replace />
    }
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
