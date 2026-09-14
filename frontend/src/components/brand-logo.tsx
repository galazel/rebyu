type BrandLogoProps = {
  className?: string
}

/**
 * Rebyu mark: a small wood-framed chalkboard with a chalk "r" and a stick of
 * chalk on its tray -- the classroom identity in 40 units.
 *
 * Drawn as SVG so it stays crisp at every size, needs no request, and takes its
 * size from the `size-*` class at each call site. Decorative: the wordmark
 * beside it carries the name. The favicon PNGs in public/brand/classroom are
 * rendered from the same shapes.
 */
export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect x="1.5" y="3" width="37" height="30" rx="4" fill="#8a5a33" />
      <rect x="5" y="6.5" width="30" height="23" rx="2" fill="#2f4a3c" />
      <text
        x="20"
        y="18.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f4f1e8"
        fontSize="18"
        fontFamily='"REBYU Chalk", "Patrick Hand", ui-rounded, sans-serif'
      >
        r
      </text>
      <rect x="7" y="33" width="26" height="3.2" rx="1.6" fill="#b07a4a" />
      <rect x="23" y="31.4" width="7" height="2" rx="1" fill="#f4f1e8" />
    </svg>
  )
}
