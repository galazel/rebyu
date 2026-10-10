import { useState } from "react"
import { Award } from "@/components/icons"

import { certificationBadgeUrl } from "@/services/certificationService.js"

/**
 * The badge and certificate a learner earned for a certification, shared by the
 * certification catalogue and My Learning so both read the same.
 *
 * The image falls back to the award icon when it cannot load -- a certification
 * with no badge artwork, or a request that failed -- instead of showing a broken
 * image. `onView` makes the strip a link to the badge page.
 */
export default function EarnedStrip({ certificationId, award, onView, className = "mt-3" }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (!award) return null
  const hasBadge = award.badgeAwardedAt != null
  const hasCertificate = award.certificateAwardedAt != null
  if (!hasBadge && !hasCertificate) return null

  const showImage = hasBadge && award.hasBadgeImage !== false && !imageFailed
  const Wrapper = onView ? "button" : "div"

  return (
      <Wrapper
          {...(onView
              ? { type: "button", onClick: onView, "aria-label": "View your earned badge" }
              : {})}
          className={`${className} flex w-full items-center gap-3 rounded-xl border-2 border-rb-bee/50 bg-rb-bee-wash px-3 py-2 text-left ${
              onView
                  ? "transition-colors hover:border-rb-bee focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-bee"
                  : ""
          }`}
      >
        {hasBadge ? (
            showImage ? (
                <img
                    src={`${certificationBadgeUrl(certificationId)}?v=${encodeURIComponent(award.badgeAwardedAt)}`}
                    alt=""
                    onError={() => setImageFailed(true)}
                    className="size-12 shrink-0 rounded-full border-2 border-white bg-white object-cover shadow-sm"
                />
            ) : (
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-rb-bee text-white shadow-sm">
                  <Award className="size-6" aria-hidden="true" />
                </span>
            )
        ) : null}
        <span className="min-w-0 text-xs leading-5">
          {hasBadge ? <span className="block font-bold text-rb-eel">Badge earned</span> : null}
          {hasCertificate ? (
              <span className="block truncate text-rb-wolf">
                Certificate <span className="font-mono font-semibold">{award.certificateNumber}</span>
              </span>
          ) : null}
        </span>
      </Wrapper>
  )
}
