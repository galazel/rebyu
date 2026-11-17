import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { AlertCircle, AlertTriangle, Check, Loader2, LogIn } from "@/components/icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { roleHomePath, useAuth } from "@/context/auth-context.jsx"
import { resendVerificationCode, signInState, toSafeAuthMessage } from "@/services/authService.js"
import AuthShell from "./auth-shell.jsx"

async function passwordRejectedNotice(email) {
  const state = await signInState(email)
  switch (state) {
    case "NEEDS_SIGN_IN":
      return {
        tone: "warning",
        title: "Your account needs a new sign-in",
        message:
          "This email joined REBYU before 16 September 2026, when sign-in moved to a new system. Create a new sign-in with the same email and your progress, XP and certifications carry over.",
        action: { to: "/register", label: "Create your sign-in", state: { email } },
      }
    case "NO_ACCOUNT":
      return {
        tone: "warning",
        title: "No account with this email",
        message: "Check the address for typos, or create an account to get started.",
        action: { to: "/register", label: "Create an account", state: { email } },
      }
    case "READY":
      return {
        tone: "error",
        title: "Incorrect password",
        message: "The password does not match this email.",
        action: { to: "/forgot-password", label: "Reset your password", state: { email } },
      }
    default:
      return { tone: "error", title: "Incorrect email or password", message: "Check both and try again." }
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, user, status } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [signedInUser, setSignedInUser] = useState(null)

  useEffect(() => {
    if (status === "authenticated" && user?.role && !signedInUser) {
      navigate(roleHomePath(user.role), { replace: true })
    }
  }, [navigate, status, user?.role, signedInUser])

  useEffect(() => {
    if (sessionStorage.getItem("rebyu_session_expired")) {
      sessionStorage.removeItem("rebyu_session_expired")
      setError({ tone: "warning", title: "Your session expired", message: "Please sign in again." })
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    setError(null)
    setPending(true)

    const cleanEmail = email.trim().toLowerCase()

    try {
      const result = await login(cleanEmail, password)

      if (result?.needsNewPassword) {
        toast.info("Create a new password to finish activating your account.")

        navigate("/set-new-password", {
          state: {
            email: cleanEmail,
          },
        })

        return
      }

      if (result?.needsConfirmation) {
        toast.info("Your account is not verified yet. Enter the code we emailed you.")

        await resendVerificationCode(cleanEmail).catch(() => {})

        navigate("/verify-email", {
          state: {
            email: cleanEmail,
          },
        })

        return
      }

      if (result?.needsPasswordReset) {
        toast.info("Reset your password before signing in.")

        navigate("/forgot-password", {
          state: {
            email: cleanEmail,
          },
        })

        return
      }

      const loggedUser = result?.user

      if (!loggedUser) {
        setError({ tone: "error", title: "Unable to load your account", message: "Please try again." })
        return
      }

      setSignedInUser(loggedUser)

      const displayName =
        loggedUser.name ||
        loggedUser.firstName ||
        loggedUser.email?.split("@")[0] ||
        "there"

      toast.success(`Welcome back, ${displayName}!`, {
        description: "Signed in successfully. Taking you to your dashboard...",
        duration: 3500,
      })

      setTimeout(() => {
        const pendingToken = sessionStorage.getItem("rebyu_pending_invitation_token")
        if (pendingToken) {
          sessionStorage.removeItem("rebyu_pending_invitation_token")
          navigate(`/invitations/accept?token=${encodeURIComponent(pendingToken)}`, {
            replace: true,
          })
          return
        }

        navigate(roleHomePath(loggedUser.role), { replace: true })
      }, 700)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Login failed:", err?.name, err?.message)

      if (err?.name === "UserNotConfirmedException") {
        toast.info("Your account is not verified yet. Enter the code we emailed you.")

        await resendVerificationCode(cleanEmail).catch(() => {})

        navigate("/verify-email", {
          state: {
            email: cleanEmail,
          },
        })

        return
      }

      if (
          err?.name === "PasswordResetRequiredException" ||
          err?.name === "ResetPasswordException"
      ) {
        toast.info("Reset your password before signing in.")

        navigate("/forgot-password", {
          state: {
            email: cleanEmail,
          },
        })

        return
      }

      if (err?.name === "NotAuthorizedException") {
        setError(await passwordRejectedNotice(cleanEmail))
        return
      }

      setError({ tone: "error", title: "Sign-in failed", message: toSafeAuthMessage(err, "Incorrect email or password.") })
    } finally {
      setPending(false)
    }
  }

  if ((status === "loading" || status === "authenticated") && !signedInUser) {
    return null
  }

  return (
      <AuthShell
          side="left"
          story="login"
          title="Sign in"
          description="Enter your account details to continue your certification review."
          showBackButton
          backTo="/"
          backLabel="Back"
          onBack={() => navigate("/", { replace: true })}
          footer={
            <>
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </>
          }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>

            <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                disabled={pending || Boolean(signedInUser)}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-10"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>

              <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <PasswordInput
                id="login-password"
                autoComplete="current-password"
                required
                disabled={pending || Boolean(signedInUser)}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10"
            />
          </div>

          {signedInUser ? (
            <div className="flex items-center gap-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 p-3.5 text-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm dark:bg-emerald-500">
                <Check className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                  Welcome back, {signedInUser.name || signedInUser.firstName || signedInUser.email?.split("@")[0] || "there"}!
                </p>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                  Signed in successfully. Redirecting to your dashboard...
                </p>
              </div>
            </div>
          ) : null}

          {error ? (
              <Alert
                  variant={error.tone === "warning" ? "default" : "destructive"}
                  role={error.tone === "warning" ? "status" : "alert"}
                  className={error.tone === "warning" ? "border-amber-400/70 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-200" : undefined}
              >
                {error.tone === "warning" ? <AlertTriangle className="size-4" /> : <AlertCircle className="size-4" />}
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>
                  <span>{error.message}</span>
                  {error.action ? (
                      <Link
                          to={error.action.to}
                          state={error.action.state}
                          className="mt-1 inline-block font-semibold underline underline-offset-2"
                      >
                        {error.action.label}
                      </Link>
                  ) : null}
                </AlertDescription>
              </Alert>
          ) : null}

          <Button
            type="submit"
            className={`h-10 w-full transition-all duration-300 ${
              signedInUser
                ? "!bg-emerald-600 hover:!bg-emerald-600 !text-white dark:!bg-emerald-500 shadow-sm"
                : ""
            }`}
            disabled={pending || Boolean(signedInUser)}
          >
            {signedInUser ? (
              <span className="flex items-center justify-center gap-2 font-semibold">
                <Check className="size-4 animate-in zoom-in duration-200" aria-hidden="true" />
                Signed in! Redirecting...
              </span>
            ) : pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
            ) : (
                <>
                  <LogIn className="size-4" aria-hidden="true" />
                  Sign in
                </>
            )}
          </Button>
        </form>
      </AuthShell>
  )
}
