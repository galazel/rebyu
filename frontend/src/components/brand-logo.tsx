type BrandLogoProps = {
  className?: string
}

/**
 * The REBYU mark: the pair of watching eyes from the logo, cut from the
 * supplied artwork with a transparent background. Decorative on its own; the
 * wordmark beside it, or `BrandWordmark`, carries the name. Size comes from
 * the `size-*` class at each call site.
 */
export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <img
      src="/brand/rebyu-mark.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`shrink-0 select-none object-contain ${className}`}
    />
  )
}

type BrandWordmarkProps = {
  className?: string
  /** Accessible name; the image is the whole brand, so it needs one. */
  alt?: string
}

/**
 * The full logo -- eyes plus the outlined REBYU letters. The letters are
 * white with a green outline, so it reads on the white body and on the green
 * portal header alike. Height is set by the call site (`h-8`, `h-10`); width
 * follows the 4.7:1 artwork.
 */
export function BrandWordmark({ className = "", alt = "REBYU" }: BrandWordmarkProps) {
  return (
    <img
      src="/brand/rebyu-logo.png"
      alt={alt}
      draggable={false}
      className={`w-auto shrink-0 select-none object-contain ${className}`}
    />
  )
}
