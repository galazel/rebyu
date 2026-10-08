import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Award, Zap } from "@/components/icons"
import { AnimatePresence, CountUp, motion } from "@/components/motion/rebyu-motion.jsx"
import { Confetti } from "@/components/motion/confetti.jsx"
import { achievementBadge, achievementKey, earnedAchievementKeys } from "@/lib/achievements.js"
import { getMyRewards } from "@/services/learnerService.js"
import { playAchievementChime } from "@/lib/sound.js"


let currentListener = null
let pending = []

let nextCardId = 0

let showing = false

function isCelebrating() {
  return showing || pending.length > 0
}

function publishCelebration(card) {
  nextCardId += 1
  const withId = { ...card, id: nextCardId }
  if (currentListener) {
    currentListener((queue) => [...queue, withId])
    return
  }
  pending = [...pending, withId]
}

const HOLD_MS = { achievement: 3600, xp: 2600 }

function XpAwardModal() {
  const [queue, setQueue] = useState([])

  useEffect(() => {
    currentListener = setQueue
    if (pending.length > 0) {
      const buffered = pending
      pending = []
      setQueue((current) => [...current, ...buffered])
    }
    return () => {
      currentListener = null
    }
  }, [])

  const card = queue[0] ?? null
  const dismiss = () => setQueue((current) => current.slice(1))

  useEffect(() => {
    showing = queue.length > 0
    return () => {
      showing = false
    }
  }, [queue.length])



  useEffect(() => {
    if (!card) return undefined
    const id = setTimeout(dismiss, HOLD_MS[card.kind] ?? HOLD_MS.xp)
    return () => clearTimeout(id)
  }, [card?.id])

  const confettiKey = card?.kind === "achievement" ? String(card.id) : null

  useEffect(() => {
    if (!confettiKey) return
    playAchievementChime()
  }, [confettiKey])

  return (
    <>
      <Confetti fire={confettiKey} />




      <AnimatePresence mode="wait">
        {card ? (
          <motion.div
            key={card.id}
            className="rebyu-ds fixed inset-0 z-[60] flex overflow-y-auto bg-rb-polar px-6 py-10 text-center"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={dismiss}
          >
            <motion.div
              className="m-auto w-full max-w-md"
              initial={{ opacity: 0, y: -48, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="flex flex-col items-center">
                {card.kind === "achievement" ? (
                  <AchievementCard card={card} />
                ) : (
                  <XpCard card={card} />
                )}
              </div>




              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  dismiss()
                }}
                className="mt-4 inline-block rounded-rb-control px-3 py-1 font-rb-display text-sm font-extrabold lowercase text-rb-wolf underline-offset-4 transition-colors hover:text-rb-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw"
              >
                {queue.length > 1 ? "next" : "continue"}
              </button>

              <motion.span
                className="mt-3 block h-1 rounded-rb-pill bg-rb-swan"
                aria-hidden="true"
              >
                <motion.span
                  className="block h-full rounded-rb-pill bg-rb-macaw"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: (HOLD_MS[card.kind] ?? HOLD_MS.xp) / 1000, ease: "linear" }}
                />
              </motion.span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

function XpCard({ card }) {
  return (
    <>
      <motion.span
        className="grid size-16 place-items-center rounded-3xl bg-rb-bee text-white"
        initial={{ scale: 0.5, rotate: -20 }}
        animate={{ scale: [0.5, 1.16, 1], rotate: 0 }}
        transition={{ duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }}
        aria-hidden="true"
      >
        <Zap className="size-8" />
      </motion.span>

      <p className="mt-4 font-rb-display text-2xl font-extrabold lowercase leading-none text-rb-eel">
        {card.title}
      </p>

      <motion.p
        className="mt-3 font-rb-display text-4xl font-black leading-none text-rb-bee-lip"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
      >
        +{card.gained} XP
      </motion.p>

      <p className="mt-2 text-sm font-bold text-rb-wolf">
        <CountUp value={card.total} className="tabular-nums" /> XP total
      </p>
    </>
  )
}

function Badge({ achievement, className }) {
  const badge = achievementBadge(achievement)
  return badge ? (
    <img src={badge} alt="" className={`object-contain drop-shadow ${className}`} />
  ) : (
    <span className={`grid place-items-center rounded-3xl bg-rb-bee text-white ${className}`}>
      <Award className="size-1/2" aria-hidden="true" />
    </span>
  )
}

function AchievementCard({ card }) {
  const achievement = card.achievement

  return (
    <>
      <div className="relative flex w-full flex-col items-center">
        <motion.span
          className="pointer-events-none absolute -top-4 size-60 rounded-full bg-rb-beetle/25 blur-2xl"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          aria-hidden="true"
        />

        <motion.div
          className="relative z-10 grid size-44 place-items-center drop-shadow-[0_10px_10px_rgb(0_0_0/0.26)]"
          initial={{ scale: 0.3, rotate: -18, y: -10 }}
          animate={{ scale: [0.3, 1.18, 1], rotate: 0, y: 0 }}
          transition={{ duration: 0.62, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <Badge achievement={achievement} className="size-full" />
        </motion.div>

        <motion.div
          className="relative -mt-9 w-full"
          initial={{ scaleX: 0.2, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.16, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="absolute -left-1 top-2 h-8 w-8 bg-rb-beetle-lip"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 70%)" }}
            aria-hidden="true"
          />
          <span
            className="absolute -right-1 top-2 h-8 w-8 bg-rb-beetle-lip"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)" }}
            aria-hidden="true"
          />

          <div
            className="relative grid h-12 place-items-center bg-rb-beetle px-8"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, calc(100% - 18px) 50%, 100% 100%, 0 100%, 18px 50%)",
            }}
          >
            <p className="truncate font-rb-display text-lg font-extrabold lowercase leading-none text-white">
              {achievement?.title}
            </p>
          </div>
        </motion.div>
      </div>

      <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-rb-wolf">
        Achievement unlocked
      </p>

      <p className="mt-2 text-sm font-bold leading-5 text-rb-wolf">
        {achievement?.description}
      </p>
    </>
  )
}

export { XpAwardModal, isCelebrating }

const PORTAL_KEY = ["learner-portal-data"]
const REWARDS_KEY = ["learner-rewards"]

export async function snapshotRewards(queryClient) {
  const cached = queryClient.getQueryData(REWARDS_KEY) ?? queryClient.getQueryData(PORTAL_KEY)
  const data =
    cached ??
    (await queryClient.ensureQueryData({ queryKey: REWARDS_KEY, queryFn: getMyRewards }).catch(() => null))

  return {
    xp: Number(data?.totalXp) || 0,
    achievements: earnedAchievementKeys(data?.achievements),
  }
}

export function prefetchRewards(queryClient) {
  return queryClient.prefetchQuery({ queryKey: REWARDS_KEY, queryFn: getMyRewards, staleTime: 60_000 })
}

export async function announceRewards({ queryClient, before, title, fallback, silentXp = false }) {
  const data = await queryClient
    .fetchQuery({ queryKey: REWARDS_KEY, queryFn: getMyRewards, staleTime: 0 })
    .catch(() => null)
  if (data) {
    queryClient.setQueryData(PORTAL_KEY, (portal) =>
      portal ? { ...portal, totalXp: data.totalXp, achievements: data.achievements } : portal
    )
    queryClient.invalidateQueries({ queryKey: PORTAL_KEY })
  }

  const total = Number(data?.totalXp) || 0
  const gained = total - (before?.xp ?? 0)

  if (!silentXp) {
    if (gained > 0) {
      publishCelebration({ kind: "xp", title, gained, total })
    } else {
      toast.success(title, fallback ? { description: fallback } : undefined)
    }
  }

  const earnedBefore = before?.achievements ?? new Set()
  const unlocked = (Array.isArray(data?.achievements) ? data.achievements : []).filter(
    (achievement) => achievement?.earned && !earnedBefore.has(achievementKey(achievement))
  )

  unlocked.forEach((achievement) => {
    publishCelebration({
      kind: "achievement",
      title: achievement.title,
      achievement,
    })
  })

  return { gained, unlocked: unlocked.length }
}
