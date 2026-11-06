import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"

import { ARENA_LEARNER_PATHS, getArena } from "@/lib/arenas.js"
import { getChallengesForCertification } from "@/services/challengeService.js"
import { cn } from "@/lib/utils"

const railButton =
  "group relative grid size-12 place-items-center rounded-full border-2 border-rb-swan bg-rb-snow text-rb-eel shadow-[var(--comic-shadow-sm)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw"

/**
 * The challenges an admin assigned to this certification, as round buttons on the
 * left of the learning path (the class/calendar/progress dock is on the right).
 * Only live challenges show; nothing renders when there are none.
 */
/**
 * Shared by the rail and the learning path page: the page calls it before its own
 * loading state returns, so the challenges are fetched alongside the curriculum
 * and the rail appears with the other docks instead of after them.
 */
export function useCertificationChallenges(certificationId) {
  return useQuery({
    queryKey: ["certification-challenges", String(certificationId)],
    queryFn: () => getChallengesForCertification(certificationId),
    enabled: certificationId != null,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function ChallengeRail({ certificationId }) {
  const query = useCertificationChallenges(certificationId)
  const challenges = (Array.isArray(query.data) ? query.data : [])
    .map((status) => {
      const path = ARENA_LEARNER_PATHS[status.arenaId]
      const to = path && status.arenaId === "worldcup" ? `${path}?track=${certificationId}` : path
      return { status, arena: getArena(status.arenaId), to }
    })
    .filter((item) => item.arena && item.to)
  const reduceMotion = useReducedMotion()
  if (!challenges.length) return null

  // Gentle bob + a soft pulsing ring, staggered so the buttons don't move in step;
  // a quick wiggle on hover. All of it is off when the device asks for reduced motion.
  const buttons = challenges.map(({ arena, to }, index) => (
    <Link key={arena.id} to={to} aria-label={`Challenge: ${arena.name}`} title={`Challenge: ${arena.name}`} className={railButton}>
      {reduceMotion ? null : (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-rb-macaw"
          initial={{ scale: 1, opacity: 0.55 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: index * 0.45 }}
        />
      )}
      <motion.span
        aria-hidden="true"
        className="grid place-items-center"
        animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
        transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
        whileHover={reduceMotion ? undefined : { rotate: [0, -12, 10, -6, 0], scale: 1.12, transition: { duration: 0.5 } }}
      >
        <arena.icon className="size-5" />
      </motion.span>
      <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-rb-eel px-2.5 py-1 text-xs font-bold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block">
        {arena.name}
      </span>
    </Link>
  ))

  return (
    <>
      {/* Desktop: stays at the left of the path while scrolling */}
      <div className="pointer-events-none sticky top-24 z-30 hidden h-0 lg:block" aria-label="Challenges for this certification">
        <div className="pointer-events-auto absolute left-6 flex flex-col items-center gap-3 xl:left-8">
          <span className="rounded-full bg-rb-eel px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Challenges
          </span>
          {buttons}
        </div>
      </div>
      {/* Phones and tablets: bottom-left, above the bottom navigation, mirroring the right dock */}
      <nav
        aria-label="Challenges for this certification"
        className={cn("fixed bottom-20 left-4 z-40 flex flex-col items-start gap-3 lg:hidden")}
      >
        {buttons}
      </nav>
    </>
  )
}

export default ChallengeRail
