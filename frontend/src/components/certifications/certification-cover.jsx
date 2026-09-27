import { Award } from "@/components/icons"

import { cn } from "@/lib/utils"

/**
 * The default cover for a certification: the arena card's cap, reused.
 *
 * It used to be one oversized lowercase wordmark filling the whole panel,
 * sized by a formula that measured the title in ems per character. That
 * formula was calibrated against the rounded display face; the moment the
 * portals took the institution's condensed one, every letter changed width and
 * long names broke over three lines and were clipped from the top -- "IT
 * Passport Exam" losing its first line is not a cover, it is a bug.
 *
 * So the name is no longer load-bearing here. This is the shape the challenges
 * page already uses (see BubbleCard): a flat feather face, two oversized
 * translucent circles bled off opposite corners for depth without an image,
 * and a circular medallion in the middle. The title still bleeds across the
 * bottom at low contrast -- it is what tells two certifications apart at a
 * glance -- but it is set on one line and allowed to run off the edge, so no
 * measurement of the face can make it clip wrongly. The readable name lives in
 * the card body underneath, where it always did.
 */
export default function CertificationCover({
  title,
  badgeSrc,
  icon: Icon = Award,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        // Always full-strength green. There is no dimmed variant: a generating
        // or empty certification is marked by a badge over the cover, not by
        // draining the colour out of it.
        "rebyu-ds group/cover relative isolate flex items-center justify-center overflow-hidden bg-rb-feather",
        className,
      )}
      style={{ containerType: "inline-size" }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 -left-7 size-32 rounded-full bg-white/10" />

      {/* Bled off the bottom-left corner, behind the medallion. Sized in `cqw`
          so it scales with the card rather than the viewport, and kept to one
          line: a long name runs out of the panel, which reads as bleed, where
          wrapping and clipping read as breakage. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 left-2 select-none whitespace-nowrap font-rb-display font-black lowercase leading-none text-white/20"
        style={{ fontSize: "clamp(2.5rem, 22cqw, 5rem)" }}
      >
        {title}
      </span>

      {/* The badge if the certification has one, the generic mark if not --
          either way the middle of the cap is occupied, which is what stops the
          panel reading as an empty green rectangle. */}
      <span className="grid size-20 place-items-center overflow-hidden rounded-full bg-white/20 text-white transition-transform duration-300 group-hover/cover:scale-105">
        {badgeSrc ? (
          <img src={badgeSrc} alt="" className="size-full object-cover" />
        ) : (
          <Icon className="size-10" strokeWidth={1.7} aria-hidden="true" />
        )}
      </span>

      {children}
    </div>
  )
}
