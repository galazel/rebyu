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
