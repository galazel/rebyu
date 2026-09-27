import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { CheckCircle2, CircleAlert, Loader2, Mail, ShieldCheck } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { base } from "@/services/base"
import { clearLearnerPortalSnapshot } from "@/services/learnerService.js"

const ACCEPT_INVITATION_ENDPOINT = "learners/accept-invitation"
const LEARNER_LEARNING_ROUTE = "/learner/learning"
const LOGIN_ROUTE = "/login"
const PENDING_INVITATION_KEY = "rebyu_pending_invitation_token"

// Friendly messages keyed by the backend errorCode, with an HTTP-status
// fallback for anything unexpected.
const ERROR_BY_CODE = {
  INVALID_TOKEN: "This invitation link is invalid. Please use the exact link from your email.",
  INVITATION_EXPIRED: "This invitation has expired. Ask your institution to send a new one.",
  INVITATION_REVOKED: "This invitation was cancelled by your institution.",
  ALREADY_ACCEPTED: "This invitation has already been accepted.",
  EMAIL_MISMATCH:
    "This invitation was sent to a different email. Sign in with the invited email address.",
  ALREADY_ENROLLED: "You already have access to this certification.",
  NOT_AUTHENTICATED: "Please sign in to accept this invitation.",
}

function resolveError(error) {
  const status = error?.response?.status ?? error?.status
  const code = error?.response?.data?.errorCode
  const message =
    (code && ERROR_BY_CODE[code]) ||
    error?.response?.data?.message ||
    (status === 401 || status === 403
      ? "Please sign in using the email address that received this invitation."
      : "This invitation is invalid, expired, cancelled, or has already been used.")
  return { status, code, message }
}

export default function AcceptInstitutionInvitationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const token = String(searchParams.get("token") ?? "").trim()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [certificationTitle, setCertificationTitle] = useState("")

  const hasValidToken = Boolean(token)

  async function handleAcceptInvitation() {
    if (!hasValidToken || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      // base() returns response.data directly.
      const payload = await base(ACCEPT_INVITATION_ENDPOINT, {
        method: "POST",
        data: { token },
      })

      setCertificationTitle(payload?.certificationTitle ?? "")

      // Only strip the token from the URL after a confirmed success.
      window.history.replaceState({}, document.title, window.location.pathname)

      /* Refresh learner data so the new certification appears immediately.

         Two things have to happen here, and only doing the first is why an
         accepted invitation used to land on a My Learning that still did not
         list it -- until the learner navigated away and came back, at which
         point it was there.

         The stored snapshot goes first. This page lives OUTSIDE the learner
         shell, so the shell's query has no observer mounted while we are here
         and nothing is redrawing. When the shell does mount a moment later it
         seeds itself from that snapshot, which was written before the
         acceptance: it draws the old list at once and refetches behind it,
         with data already present and therefore no loading state. The portal
         call is the slow one -- it walks every enrolled certification -- so
         the old list is what is on screen for the whole of it. Removed, the
         shell has nothing to draw and waits properly.

         Then the refetch, with `refetchType: "all"`. The default only
         refetches queries that have an active observer, and none of these do
         from this route -- they would merely be marked stale and left for
         whenever something mounts them. Asking for all of them, and awaiting
         it, means the cache is already correct by the time "Open My Learning"
         is pressed, so the shell finds fresh data rather than fetching it.

         `learner-certification-progress` is in the list because My Learning
         reads the cards' progress bars from its own query, not from the
         portal -- it was never invalidated, so even once the card appeared its
         bar came from the answer given before the certification existed.
         `learner-notification-invitations` is here so the invitation stops
         being offered in the bell once it has been taken. */
      clearLearnerPortalSnapshot()

      /* Caught, and deliberately not reported. The invitation is accepted --
         the server said so -- and the catch below is for acceptance failures.
         Letting a refresh error fall into it would tell the learner their
         invitation did not work when it did, and send them back to a link
         that now correctly answers ALREADY_ACCEPTED. A refresh that fails
         leaves a stale list, which the shell's own refetch fixes. */
      await queryClient
        .invalidateQueries({
          predicate: (query) =>
            [
              "learner-portal-data",
              "learner-certification-progress",
              "learner-enrollments",
              "learner-notification-invitations",
              "certifications",
            ].includes(query.queryKey?.[0]),
          refetchType: "all",
        })
        .catch((refreshError) => {
          console.warn("invitation accepted, refresh failed", refreshError)
        })

      setAccepted(true)
      toast.success("Invitation accepted", {
        description: payload?.certificationTitle
          ? `You now have access to ${payload.certificationTitle}.`
          : "Your certification access is now available.",
      })
    } catch (error) {
      const { status, message } = resolveError(error)

      // Not signed in: keep the token and send them to log in, then return.
      if (status === 401 || status === 403) {
        sessionStorage.setItem(PENDING_INVITATION_KEY, token)
        toast.info("Sign in with your invited email to accept this invitation.")
        navigate(LOGIN_ROUTE, { replace: true })
        return
      }

      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function goToLearning() {
    navigate(LEARNER_LEARNING_ROUTE, { replace: true })
  }

  if (!hasValidToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
        <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <CircleAlert className="size-6 text-destructive" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-foreground">
            Invalid invitation link
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This invitation link does not contain a valid token. Please use the
            complete invitation link sent to your email.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => navigate("/", { replace: true })}
          >
            Go to Home
          </Button>
        </section>
      </main>
    )
  }

  if (accepted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
        <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <p className="mt-5 text-sm font-semibold text-primary">
            Invitation Accepted
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            You are now enrolled
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {certificationTitle
              ? `You now have access to ${certificationTitle}. Start learning whenever you are ready.`
              : "Your certification access has been added to your REBYU account."}
          </p>
          <Button type="button" className="mt-7 w-full" onClick={goToLearning}>
            Open My Learning
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-primary/5 px-8 py-9 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>
          <p className="mt-5 text-sm font-semibold text-primary">
            REBYU Institution Invitation
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            You have been invited
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Accept this invitation to receive certification access from your
            institution.
          </p>
        </div>

        <div className="p-8">
          <div className="flex gap-3 border-y border-border bg-muted/50 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Before you continue
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Make sure you are signed in using the same email address where
                this invitation was sent. An invitation can only be accepted
                once.
              </p>
            </div>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
            >
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
              <p className="text-sm leading-6 text-destructive">{errorMessage}</p>
            </div>
          ) : null}

          <Button
            type="button"
            className="mt-6 w-full"
            onClick={handleAcceptInvitation}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Accepting Invitation...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>

          <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
            Do not accept this invitation if it was not intended for you.
          </p>
        </div>
      </section>
    </main>
  )
}
