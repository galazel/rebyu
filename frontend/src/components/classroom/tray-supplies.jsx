/**
 * A whole pencil and two sticks of chalk lying on a chalkboard's tray.
 *
 * Drawn as SVG rather than cut from the supplies artwork: every pencil in that
 * sheet runs off its edge, so a cut-out always shows a sliced-off end. Place it
 * inside a `.rb-chalkboard`; `-bottom-[23px]` sets it on the tray (the board's
 * `::after`). Ornament only.
 */
export function TraySupplies({ className = "" }) {
  return (
    <svg
      viewBox="0 0 220 22"
      aria-hidden="true"
      className={`pointer-events-none absolute -bottom-[23px] right-[9%] z-10 h-auto w-60 drop-shadow-[0_2px_2px_rgb(20_14_8/0.35)] ${className}`}
    >
      {/* chalk */}
      <rect x="0" y="12" width="26" height="8" rx="3" fill="#f4f1e8" />
      <rect x="30" y="13" width="17" height="7" rx="3" fill="#f2d479" />

      {/* pencil, eraser end to the left */}
      <g transform="translate(58 4)">
        <rect x="0" y="0" width="12" height="16" rx="3" fill="#e8928f" />
        <rect x="10" y="0" width="10" height="16" fill="#b9bcc0" />
        <rect x="12.5" y="0" width="1.5" height="16" fill="#8f9398" />
        <rect x="16" y="0" width="1.5" height="16" fill="#8f9398" />
        <rect x="20" y="0" width="104" height="16" fill="#f0c33c" />
        <rect x="20" y="0" width="104" height="5.3" fill="#f7d566" />
        <rect x="20" y="10.7" width="104" height="5.3" fill="#d9a92a" />
        <polygon points="124,0 150,6.4 150,9.6 124,16" fill="#efcfa6" />
        <polygon points="143,4.7 158,8 143,11.3" fill="#3b3a3a" />
      </g>
    </svg>
  )
}
