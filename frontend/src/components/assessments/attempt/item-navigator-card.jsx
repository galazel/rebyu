import { FlagIcon } from "@/components/icons"

import { cn } from "@/lib/utils"
import { deriveItemStatus, ITEM_STATUS } from "./item-status.js"

// One item in the navigator. Shows number, points, status (icon + border +
// text), a flag overlay, and — for parent items — the sub-question completion.
// Never relies on color alone.
//
// The bottom row is points and sub-question count only, with no layers glyph:
// five pads across a 300px column leave about 48px each, and "12 pt" beside a
// glyph and "2/2" ran off the pad's right edge.
export default function ItemNavigatorCard({ item, index, isCurrent, onJump }) {
  const status = isCurrent ? ITEM_STATUS.current : deriveItemStatus(item)
  const StatusIcon = status.icon
  const hasSubs = (item.subQuestionCount ?? 0) > 0

  const srLabel = [
    `Item ${index + 1}`,
    item.points != null ? `${Number(item.points)} points` : null,
    status.label,
    item.flagged ? "flagged" : null,
    hasSubs
      ? `${item.subAnsweredCount ?? 0} of ${item.subQuestionCount} sub-questions answered`
      : null,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <button
      type="button"
      onClick={() => onJump(index)}
      aria-current={isCurrent ? "true" : undefined}
      aria-label={srLabel}
      className={cn(
        "relative flex min-h-14 min-w-0 flex-col justify-between rounded-[var(--radius-rb-control)] border-2 p-1.5 text-left font-bold outline-none transition",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw",
        "active:translate-y-[2px]",
        status.card
      )}
    >
      <div className="flex items-center justify-between gap-0.5">
        <span className="text-sm font-semibold leading-none">{index + 1}</span>
        <StatusIcon className="size-3 shrink-0" aria-hidden="true" />
      </div>

      <div className="flex min-w-0 items-end justify-between gap-0.5 text-[9.5px] font-medium leading-none tabular-nums opacity-80">
        {/* One fact per pad: a parent item's sub-question progress, or the
            points. Both did not fit and the points were cut to "1…". */}
        {hasSubs ? (
          <span className="truncate">
            {item.subAnsweredCount ?? 0}/{item.subQuestionCount}
          </span>
        ) : item.points != null ? (
          <span className="truncate">{Number(item.points)}pt</span>
        ) : null}
      </div>

      {item.flagged ? (
        <FlagIcon
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 size-4 fill-rb-bee text-rb-bee-lip"
        />
      ) : null}
    </button>
  )
}
