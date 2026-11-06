import { AnimatePresence, motion } from "framer-motion"

/**
 * A small "Updating your … data" notice shown in the top bar, beside the
 * notification bell, while a background refresh runs. It pops in and fades out,
 * never blocks the page, and takes no space when hidden.
 */
export function UpdatingPill({ show, label = "Updating your data…" }) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.span
          role="status"
          aria-live="polite"
          className="pointer-events-none flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-sm"
          initial={{ opacity: 0, scale: 0.85, x: 8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 8 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        >
          <span
            className="size-3.5 animate-spin rounded-full border-2 border-rb-feather/25 border-t-rb-feather"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{label}</span>
          <span className="sr-only sm:hidden">{label}</span>
        </motion.span>
      ) : null}
    </AnimatePresence>
  )
}
