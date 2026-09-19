import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CheckIcon, Clock, InfoIcon, Loader2Icon, LockIcon, XCircleIcon } from "@/components/icons"
import ProBadge from "@/components/learner/pro-badge.jsx"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"
import { apiMessage } from "@/services/base"
import { getCurrentLearnerIdentity } from "@/services/learnerService.js"
import {
  cancelSubscription,
  getIndividualPlans,
  getLearnerSubscription,
  initiateCheckout,
} from "@/services/subscriptionService.js"

/* What each plan is, in the words a learner decides by. Kept here rather than
   derived from entitlement codes: the codes describe enforcement, these
   describe the product, and the two lists must say the same thing as the
   gates in AssessmentAttemptService, LearnerToolsController and friends. */
const FREE_INCLUDES = [
  "Every lesson in every certification",
  "The diagnostic, and one attempt at each quiz, middle and major exam",
  "Community posts and the first 2 pages of shared files",
  "CodeStrike and Blueprint Arena: the first 5 problems each",
]
const FREE_EXCLUDES = [
  "Quiz and exam retakes",
  "Mock exams",
  "AI tutor",
  "Mistake bank",
  "Shared quizzes, exams and full files in the community",
  "World Cup",
]
const PRO_INCLUDES = [
  "Everything in Free",
  "Unlimited retakes of quizzes, middle and major exams",
  "Full mock exams",
  "AI tutor, with up to 10 generated quizzes or flashcard sets a day",
  "Mistake bank",
  "Full community: files, shared quizzes and exams",
  "Every problem in CodeStrike and Blueprint Arena, plus World Cup",
]

function formatMoney(amount, currency = "PHP") {
  const value = Number(amount)
  if (!Number.isFinite(value)) return "—"
  return value.toLocaleString("en-PH", { style: "currency", currency, maximumFractionDigits: 0 })
}

function formatDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function FeatureList({ items, excluded = false }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className={`flex items-start gap-2 ${excluded ? "text-rb-hare" : "text-rb-eel"}`}>
          {excluded ? (
            <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-rb-feather-lip" aria-hidden="true" />
          )}
          <span className={excluded ? "line-through decoration-rb-swan" : ""}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function StatusBanner({ tone, icon: Icon, title, children }) {
  const tones = {
    feather: "border-rb-feather/40 bg-rb-feather-wash",
    bee: "border-rb-bee/50 bg-rb-bee-wash",
    cardinal: "border-rb-cardinal/40 bg-rb-cardinal/10",
  }
  return (
    <div className={`flex items-start gap-3 rounded-rb-card border-2 p-4 ${tones[tone]}`}>
      <Icon className="mt-0.5 size-5 shrink-0 text-rb-eel" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-rb-display text-base font-extrabold text-rb-eel">{title}</p>
        <div className="mt-1 text-sm leading-6 text-rb-wolf">{children}</div>
      </div>
    </div>
  )
}

export default function LearnerSubscriptionPage() {
  const identity = getCurrentLearnerIdentity()
  const learnerId = identity?.learnerId ?? null
  const entitlements = useLearnerEntitlements()
  const queryClient = useQueryClient()
  const [redirecting, setRedirecting] = useState(false)

  const plansQuery = useQuery({
    queryKey: ["individual-plans"],
    queryFn: getIndividualPlans,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const subscriptionQuery = useQuery({
    queryKey: ["learner-subscription", learnerId],
    queryFn: () => getLearnerSubscription(learnerId),
    enabled: learnerId != null,
    retry: 1,
  })

  const plans = Array.isArray(plansQuery.data) ? plansQuery.data : []
  const proPlan = plans.find((plan) => !plan.isFree)
  const subscription = subscriptionQuery.data || null
  const isProActive = entitlements.personalProActive
  const awaitingApproval = Boolean(subscription?.awaitingApproval)
  const rejected = subscription?.status === "CANCELED" && Boolean(subscription?.reviewNote)

  const checkoutMutation = useMutation({
    mutationFn: () => initiateCheckout(proPlan.subscriptionPlanId),
    onSuccess: (data) => {
      if (data?.checkout_url) {
        setRedirecting(true)
        try {
          if (data.session_id) localStorage.setItem("rebyu_checkout_session", data.session_id)
        } catch {
          // The server remembers the session too.
        }
        // PayMongo's own hosted checkout page takes it from here.
        window.location.href = data.checkout_url
      } else {
        toast.error("Could not start checkout. Please try again.")
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error ?? apiMessage(error, "Could not start checkout. Please try again."))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast.success("Your subscription will not renew. Pro continues until the end of the paid period.")
      queryClient.invalidateQueries({ queryKey: ["learner-subscription", learnerId] })
      queryClient.invalidateQueries({ queryKey: ["learner-entitlements"] })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error ?? "Could not cancel your subscription.")
    },
  })

  const busy = checkoutMutation.isPending || redirecting

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <header className="text-center">
        <p className="rb-chalk-label mx-auto">plans</p>
        <h1 className="mt-3 font-rb-display text-3xl font-extrabold text-rb-eel sm:text-4xl">
          {isProActive || entitlements.institutionalActive ? "You're on Pro" : "Study further with Pro"}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-rb-wolf">
          Every lesson stays free. Pro adds retakes, mock exams, the AI tutor and the rest of REBYU.
        </p>
      </header>

      {/* Where the learner stands right now. */}
      {entitlements.isLoading || subscriptionQuery.isLoading ? (
        <p className="flex items-center justify-center gap-2 text-sm text-rb-hare">
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          Checking your plan…
        </p>
      ) : awaitingApproval ? (
        <StatusBanner tone="bee" icon={Clock} title="Payment received, waiting for approval">
          We got your PayMongo payment. An admin
          reviews each Pro subscription before it starts. Your month begins the moment it is approved.
        </StatusBanner>
      ) : isProActive ? (
        <StatusBanner tone="feather" icon={CheckIcon} title="REBYU Pro is active">
          {subscription?.cancelAtPeriodEnd ? "Access until " : "Renews "}
          {formatDate(subscription?.currentPeriodEnd ?? entitlements.currentPeriodEnd)}.{" "}
          {entitlements.aiGenerationDailyLimit > 0
            ? `AI tutor: ${Math.max(entitlements.aiGenerationDailyLimit - entitlements.aiGenerationsUsedToday, 0)} of ${entitlements.aiGenerationDailyLimit} generations left today.`
            : null}
        </StatusBanner>
      ) : entitlements.institutionalActive ? (
        <StatusBanner tone="feather" icon={CheckIcon} title="Pro through your institution">
          Your institution's licence gives you every Pro feature. There is nothing to buy.
        </StatusBanner>
      ) : rejected ? (
        <StatusBanner tone="cardinal" icon={XCircleIcon} title="Your last Pro request was not approved">
          {subscription.reviewNote}
          {subscription.refunded
            ? " Your payment has been refunded to the card or wallet you paid with."
            : " Your payment will be refunded to the card or wallet you paid with."}
        </StatusBanner>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <section className="flex flex-col rounded-rb-card border-2 border-rb-swan bg-rb-snow p-6 shadow-[var(--comic-shadow-sm)]">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-rb-hare">Free</p>
          <p className="mt-2 font-rb-display text-4xl font-extrabold text-rb-eel">₱0</p>
          <p className="mt-1 text-sm text-rb-wolf">Learn every lesson, sit each assessment once.</p>
          <div className="mt-5 flex-1 space-y-4">
            <FeatureList items={FREE_INCLUDES} />
            <FeatureList items={FREE_EXCLUDES} excluded />
          </div>
          <TactileButton variant="ghost" className="mt-6 w-full" disabled>
            {isProActive || entitlements.institutionalActive ? "Included in Pro" : "Your current plan"}
          </TactileButton>
        </section>

        <section className="relative flex flex-col rounded-rb-card border-2 border-rb-feather bg-rb-snow p-6 shadow-[var(--comic-shadow-sm)]">
          <div className="flex items-center gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-rb-feather-lip">
              {proPlan?.planName ?? "REBYU Pro"}
            </p>
            <ProBadge />
          </div>
          <p className="mt-2 font-rb-display text-4xl font-extrabold text-rb-eel">
            {proPlan ? formatMoney(proPlan.amount, proPlan.currency) : "—"}
            <span className="ml-1 text-base font-bold text-rb-hare">/ month</span>
          </p>
          <p className="mt-1 text-sm text-rb-wolf">Everything REBYU has, for as long as you are preparing.</p>
          <div className="mt-5 flex-1">
            <FeatureList items={PRO_INCLUDES} />
          </div>

          {isProActive && subscription?.status === "ACTIVE" ? (
            subscription.cancelAtPeriodEnd ? (
              <TactileButton variant="ghost" className="mt-6 w-full" disabled>
                Ends {formatDate(subscription.currentPeriodEnd)}
              </TactileButton>
            ) : (
              <TactileButton
                variant="ghost"
                className="mt-6 w-full"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? <Loader2Icon className="size-4 animate-spin" /> : "Cancel renewal"}
              </TactileButton>
            )
          ) : entitlements.institutionalActive ? (
            <TactileButton variant="ghost" className="mt-6 w-full" disabled>
              Included with your institution
            </TactileButton>
          ) : awaitingApproval ? (
            <TactileButton variant="ghost" className="mt-6 w-full" disabled>
              <Clock className="size-4" aria-hidden="true" />
              Waiting for admin approval
            </TactileButton>
          ) : (
            <TactileButton
              variant="feather"
              className="mt-6 w-full"
              onClick={() => proPlan?.subscriptionPlanId && checkoutMutation.mutate()}
              disabled={!proPlan || busy}
            >
              {busy ? <Loader2Icon className="size-4 animate-spin" aria-hidden="true" /> : "Upgrade with PayMongo"}
            </TactileButton>
          )}
        </section>
      </div>

      <div className="flex items-start gap-2 rounded-rb-card border-2 border-dashed border-rb-swan p-4 text-xs leading-5 text-rb-wolf">
        <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <b className="text-rb-eel">Test mode.</b> Checkout opens PayMongo's own payment page and no real money
          moves. Pay by credit or debit card (test card <b className="text-rb-eel">4343 4343 4343 4345</b>, any future
          expiry date and any CVC) or by GCash. After paying, an admin approves your Pro access.
        </span>
      </div>
    </div>
  )
}
