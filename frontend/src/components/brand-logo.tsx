type BrandLogoProps = {
  className?: string
}

/**
 * Rebyu mark: a pop-art eye — the same drawn eye that looks out of the landing
 * hero's comic panel — inked into a yellow badge.
 *
 * It replaced a green monogram key with a solid lip underneath, which was the
 * most Duolingo-looking object left in the product. Sizing still comes from
 * the `size-*` classes at every call site, so nothing that renders the mark had
 * to change. Decorative: the wordmark beside it carries the name.
 *
 * The badge reads `--color-rb-sun`: yellow on the landing and auth screens,
 * sky blue inside the portals (see the PORTAL PALETTE block in rebyu-comic.css).
 *
 * The artwork is `public/brand/comic/eye-mark.webp` (the favicon uses the PNG
 * exports beside it).
 */
export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-[28%] border-2 border-[#17182b] bg-rb-sun shadow-[2px_2px_0_#17182b] ${className}`}
    >
      <img
        src="/brand/comic/eye-mark.webp"
        alt=""
        draggable={false}
        className="block size-full object-cover"
      />
    </span>
  )
}
