import { Link } from "react-router-dom"

import { LockIcon } from "@/components/icons"
import ProBadge from "@/components/learner/pro-badge.jsx"
import { TactileButton } from "@/components/rebyu/rebyu-ui.jsx"
import { useLearnerEntitlements } from "@/hooks/use-learner-entitlements.js"

/**
 * A Pro-only surface for a learner on Free.
 *
 * Unlike LearnerPremiumGuard, the locked content is not rendered underneath: its
 * requests would only come back 403. Nothing locks while the plan is still
 * loading, so a Pro learner never sees the padlock flash.
 */
export function ProLockCard({ title, description, compact = false, className = "" }) {
  return (
    <div
      className={`mx-auto flex w-full max-w-lg flex-col items-center rounded-rb-card border-2 border-rb-swan bg-rb-snow text-center shadow-[var(--comic-shadow-sm)] ${
        compact ? "gap-3 p-5" : "gap-4 p-8"
      } ${className}`}
    >
      <span className="grid size-12 place-items-center rounded-full bg-rb-bee-wash text-rb-bee-lip">
        <LockIcon className="size-5" aria-hidden="true" />
      </span>
      <ProBadge />
      <h2 className="font-rb-display text-xl font-extrabold text-rb-eel">{title}</h2>
      {description ? <p className="text-sm leading-6 text-rb-wolf">{description}</p> : null}
      <TactileButton asChild variant="feather">
        <Link to="/learner/subscription">Upgrade to Pro</Link>
      </TactileButton>
    </div>
  )
}

export default function ProGate({ feature, title, description, compact, children }) {
  const entitlements = useLearnerEntitlements()
  if (entitlements.isFree && !(feature && entitlements.hasFeature(feature))) {
    return (
      <div className={compact ? "py-4" : "py-10"}>
        <ProLockCard title={title} description={description} compact={compact} />
      </div>
    )
  }
  return children
}
