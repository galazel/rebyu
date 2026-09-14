import { BrandLogo } from "@/components/brand-logo"

/**
 * The comic caption a page skeleton wears while it waits: the brand's eye,
 * bobbing, with a speech bubble saying what is being drawn.
 *
 * A grey skeleton on its own says "something is coming"; this says it in the
 * product's voice, and it puts the mascot on the one screen every learner sees
 * most often without reading it. `text` names the page when the skeleton knows
 * which page it stands in for; the generic line is for route fallbacks, which
 * cannot know.
 */
export function ComicLoadingNote({ text = "hang tight — drawing your page…", className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} role="status" aria-live="polite">
      <span className="rb-loading-bob inline-flex">
        <BrandLogo className="size-11" />
      </span>
      <p className="rb-loading-bubble">{text}</p>
    </div>
  )
}
