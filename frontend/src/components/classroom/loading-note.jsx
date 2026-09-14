/**
 * The note a page skeleton wears while it waits: a paper tag with a paper clip
 * that wiggles, saying what is being prepared.
 *
 * `text` names the page when the skeleton knows which page it stands in for;
 * the generic line is for route fallbacks, which cannot know.
 */
export function LoadingNote({ text = "hang tight — getting your page ready…", className = "" }) {
  return (
    <div className={className} role="status" aria-live="polite">
      <p className="rb-loading-note">
        <img src="/brand/classroom/clip.webp" alt="" aria-hidden="true" />
        {text}
      </p>
    </div>
  )
}
