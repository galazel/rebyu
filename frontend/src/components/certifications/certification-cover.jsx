import { Award } from "@/components/icons"

import { cn } from "@/lib/utils"

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
        "rebyu-ds group/cover relative isolate flex items-center justify-center overflow-hidden bg-rb-feather",
        className,
      )}
      style={{ containerType: "inline-size" }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 -left-7 size-32 rounded-full bg-white/10" />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 left-2 select-none whitespace-nowrap font-rb-display font-black lowercase leading-none text-white/20"
        style={{ fontSize: "clamp(2.5rem, 22cqw, 5rem)" }}
      >
        {title}
      </span>

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
