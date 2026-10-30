import { Award } from "@/components/icons"
import { AuthedImage } from "@/lib/authed-media.jsx"

/** A learner's certification review rank next to their name: badge, level and
 *  title (the same rank the account page shows). `compact` drops the title. */
export function LevelBadge({ level, compact = false, className = "" }) {
  if (!level?.levelNumber) return null
  const label = `Level ${level.levelNumber} · ${level.title}`

  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-rb-bee-wash py-0.5 pl-0.5 pr-2 text-[10px] font-extrabold text-rb-bee-lip ${className}`}
    >
      <span className="grid size-4 shrink-0 place-items-center overflow-hidden rounded-full bg-white/70">
        {level.imageKey ? (
          <AuthedImage imageKey={level.imageKey} className="h-full w-full object-cover" placeholderClassName="h-full w-full" />
        ) : (
          <Award className="size-3" aria-hidden="true" />
        )}
      </span>
      <span aria-hidden="true">
        Lv {level.levelNumber}
        {compact ? "" : ` · ${level.title}`}
      </span>
    </span>
  )
}
