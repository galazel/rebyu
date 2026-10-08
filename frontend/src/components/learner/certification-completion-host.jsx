import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/context/auth-context.jsx"
import { CertificationCompletionModal } from "@/components/learner/certification-completion-modal.jsx"
import { isCelebrating } from "@/components/learner/xp-award-modal.jsx"
import { getMyAwards } from "@/services/learnerService.js"


const RECENT_MS = 7 * 24 * 60 * 60 * 1000
const seenKey = (learnerId) => `rebyu:celebrated-certifications:${learnerId}`
const awardKey = (award) => `${award.certificationId}:${award.badgeAwardedAt}`

function readSeen(learnerId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(seenKey(learnerId)) || "[]")
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function markSeen(learnerId, award) {
  try {
    const seen = readSeen(learnerId)
    seen.add(awardKey(award))
    localStorage.setItem(seenKey(learnerId), JSON.stringify([...seen]))
  } catch {
  }
}

function isTakingAnExam(pathname) {
  return /^\/learner\/assessments\/[^/]+\/?$/.test(pathname)
}

export function CertificationCompletionHost() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const learnerId = user?.learnerId
  const isLearner = String(user?.role ?? "").toUpperCase() === "LEARNER" && learnerId != null
  const inLearnerPortal = pathname.startsWith("/learner")

  const awardsQuery = useQuery({
    queryKey: ["learner-awards"],
    queryFn: getMyAwards,
    enabled: isLearner && inLearnerPortal,
    staleTime: 0,
    retry: 1,
  })
  const { refetch } = awardsQuery

  useEffect(() => {
    if (isLearner && inLearnerPortal) refetch()
  }, [pathname, isLearner, inLearnerPortal, refetch])

  const [open, setOpen] = useState(null)
  const [dismissed, setDismissed] = useState(() => new Set())

  const candidate = useMemo(() => {
    if (!isLearner || !Array.isArray(awardsQuery.data)) return null
    const seen = readSeen(learnerId)
    const now = Date.now()
    return awardsQuery.data
      .filter((award) => award?.badgeAwardedAt)
      .filter((award) => now - new Date(award.badgeAwardedAt).getTime() < RECENT_MS)
      .filter((award) => !seen.has(awardKey(award)) && !dismissed.has(awardKey(award)))
      .sort((a, b) => new Date(a.badgeAwardedAt) - new Date(b.badgeAwardedAt))[0] ?? null
  }, [awardsQuery.data, isLearner, learnerId, dismissed])

  useEffect(() => {
    if (open || !candidate || isTakingAnExam(pathname)) return undefined
    const tryOpen = () => {
      if (isCelebrating()) return false
      setOpen(candidate)
      return true
    }
    if (tryOpen()) return undefined
    const timer = setInterval(() => {
      if (tryOpen()) clearInterval(timer)
    }, 700)
    return () => clearInterval(timer)
  }, [candidate, open, pathname])

  if (!open) return null

  const close = () => {
    markSeen(learnerId, open)
    setDismissed((current) => new Set(current).add(awardKey(open)))
    setOpen(null)
  }

  return (
    <CertificationCompletionModal
      certification={{ certificationId: open.certificationId, title: open.certificationTitle }}
      award={open}
      onClose={close}
    />
  )
}
