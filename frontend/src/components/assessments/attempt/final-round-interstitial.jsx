import { useEffect, useRef } from "react"

import { Confetti } from "@/components/motion/confetti.jsx"
import { AnimatePresence, motion } from "@/components/motion/rebyu-motion.jsx"
import { playFinalRoundBell } from "@/lib/sound.js"

const HOLD_MS = 2800

/**
 * The bell between the main round and the final round.
 *
 * A full-page takeover in the style of the award modal: the ground fades in,
 * the words punch in with a boxing-poster spring, the bell rings, confetti
 * falls. It leaves on its own after a short hold, or the moment the learner
 * clicks -- it announces a transition, it does not ask a question.
 */
export function FinalRoundInterstitial({ open, onContinue, count }) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      firedRef.current = false
      return undefined
    }
    if (!firedRef.current) {
      firedRef.current = true
      playFinalRoundBell()
    }
    const timer = window.setTimeout(() => onContinue?.(), HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [open, onContinue])

  return (
    <>
      <Confetti fire={open ? 1 : 0} />
      <AnimatePresence>
        {open ? (
          <motion.div
            key="final-round"
            className="rebyu-ds fixed inset-0 z-[60] flex overflow-y-auto bg-rb-feather-ink px-6 py-10 text-center text-white"
            role="status"
            aria-live="assertive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() => onContinue?.()}
          >
            <motion.div
              className="m-auto w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
              animate={{ opacity: 1, scale: [0.6, 1.12, 1], rotate: [-6, 2, 0] }}
              transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <motion.div
                className="mx-auto mb-6 grid size-24 place-items-center rounded-full border-4 border-white/80 bg-white/10 text-5xl shadow-[0_0_0_10px_rgba(255,255,255,0.08)]"
                animate={{ rotate: [0, -14, 12, -8, 6, 0] }}
                transition={{ duration: 0.9, delay: 0.3 }}
                aria-hidden="true"
              >
                🔔
              </motion.div>
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-white/70">
                Round {count && count > 1 ? "final" : "final"}
              </p>
              <h2 className="mt-2 font-rb-display text-4xl font-black leading-tight sm:text-5xl">
                Let&apos;s go to the final round!
              </h2>
              <p className="mt-4 text-base text-white/80">
                {count === 1
                  ? "One hands-on problem to finish. Take your time — it is marked with the whole paper."
                  : `${count} hands-on problems to finish. Take your time — they are marked with the whole paper.`}
              </p>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Click anywhere to begin
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default FinalRoundInterstitial
