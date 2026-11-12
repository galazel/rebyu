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

  const role = (user?.role ?? "LEARNER").toUpperCase()
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
