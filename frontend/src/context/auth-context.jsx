import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  getAccessToken,
  loginWithCognito,
  logoutFromCognito,
  syncCurrentUser,
  completeTemporaryPassword,
} from "@/services/authService.js"
import { getLearnerPortalData } from "@/services/learnerService.js"
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat.js"

const AuthContext = createContext(null)
const AUTH_USER_SNAPSHOT_KEY = "rebyu:auth-user-snapshot"

function subjectOf(token) {
  try {
    const payload = token.split(".")[1]
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)?.sub ?? null
  } catch {
    return null
  }
}

function readAuthUserSnapshot(subject) {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.subject || parsed.subject !== subject) return null
    return parsed.user ?? null
  } catch {
    return null
  }
}

function writeAuthUserSnapshot(subject, user) {
  try {
    sessionStorage.setItem(AUTH_USER_SNAPSHOT_KEY, JSON.stringify({ subject, user }))
  } catch {
  }
}

function clearAuthUserSnapshot() {
  try {
    sessionStorage.removeItem(AUTH_USER_SNAPSHOT_KEY)
  } catch {
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState("loading")

  const refresh = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setUser(null)
      setStatus("anonymous")
      return null
    }
    const subject = subjectOf(token)
    try {
      const cachedUser = readAuthUserSnapshot(subject)
      if (cachedUser) {
        setUser(cachedUser)
        setStatus("authenticated")
      }

      const currentUser = await syncCurrentUser()
      setUser(currentUser)
      setStatus("authenticated")
      writeAuthUserSnapshot(subject, currentUser)
      if (
        String(currentUser?.role ?? "").toUpperCase() === "LEARNER" &&
        currentUser?.learnerId != null
      ) {
        void queryClient.prefetchQuery({
          queryKey: ["learner-portal-data"],
          queryFn: getLearnerPortalData,
          staleTime: 30_000,
          gcTime: 60 * 60_000,
        })
      }
      if (currentUser?.learnerId != null) {
        localStorage.setItem("learnerId", String(currentUser.learnerId))
      } else {
        localStorage.removeItem("learnerId")
        localStorage.removeItem("learner_id")
      }
      if (currentUser?.email) localStorage.setItem("email", currentUser.email)
      if (currentUser?.displayName) {
        localStorage.setItem("name", currentUser.displayName)
      }
      if (currentUser?.role) {
        localStorage.setItem("role", currentUser.role.toLowerCase())
      }
      return currentUser
    } catch (error) {
      if (error?.response?.status === 401) {
        await logoutFromCognito().catch(() => {})
      }
      setUser(null)
      setStatus("anonymous")
      clearAuthUserSnapshot()
      return null
    }
  }, [queryClient])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(
    async (email, password) => {
      const result = await loginWithCognito(email, password)
      
      if (result?.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        return { needsConfirmation: true }
      }
      if (result?.nextStep?.signInStep === "NEW_PASSWORD_REQUIRED" ||
          result?.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        return { needsNewPassword: true }
      }
      if (result?.isSignedIn === false && result?.nextStep?.signInStep) {
        return { pendingStep: result.nextStep.signInStep }
      }
      const currentUser = await refresh()
      return { user: currentUser }
    },
    [refresh]
  )
  async function setNewPassword(newPassword) {
    try {
      const cognitoResult = await completeTemporaryPassword(newPassword)

      
      const user = await syncCurrentUser()

      if (!user) {
        throw new Error("Your password was created, but your account profile could not be loaded.")
      }

      setUser(user)

      return {
        user,
      }
    } catch (err) {
      console.error("setNewPassword error:", err?.message)
      throw err
    }
  }

  const logout = useCallback(async () => {
    await logoutFromCognito().catch(() => {})
    localStorage.removeItem("learnerId")
    localStorage.removeItem("email")
    localStorage.removeItem("name")
    localStorage.removeItem("role")
    localStorage.removeItem("rebyu_demo_role")
    clearAuthUserSnapshot()
    queryClient.clear()
    setUser(null)
    setStatus("anonymous")
  }, [queryClient])

  usePresenceHeartbeat(status === "authenticated")

  const value = useMemo(
    () => ({ user, status, login, logout, refresh ,   setNewPassword,}),
    [user, status, login, logout, refresh,   setNewPassword,]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function isInstitutionOwner(user) {
  if (!user) return false
  if (String(user.role ?? "").toUpperCase() === "DEPARTMENT_HEAD") return false
  return user.departmentHeadRole == null || user.departmentHeadRole === "owner"
}

export function isDepartmentHeadUser(user) {
  if (!user) return false
  const role = String(user.role ?? "").toUpperCase()
  if (role !== "INSTITUTION" && role !== "DEPARTMENT_HEAD") return false
  return !isInstitutionOwner(user)
}

export function roleHomePath(role) {
  switch ((role ?? "").toUpperCase()) {
    case "ADMIN":
      return "/admin/dashboard"
    case "INSTITUTION":
      return "/institution/dashboard"
    case "DEPARTMENT_HEAD":
      return "/institution/department-head"
    default:
      return "/learner/analytics"
  }
}
