import { useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { faStar } from "@fortawesome/free-solid-svg-icons"
import {
  Award,
  BookOpen,
  GraduationCap,
  Medal,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { CountUp, motion } from "@/components/motion/rebyu-motion.jsx"
import { Confetti } from "@/components/motion/confetti.jsx"
import { achievementBadge, achievementKey } from "@/lib/achievements.js"
import { playAchievementChime } from "@/lib/sound.js"
import { getCurrentLearnerIdentity, getMyRewards } from "@/services/learnerService.js"
import { certificationBadgeUrl } from "@/services/certificationService.js"


function CompletionStamp({ hasBadgeImage, certificationId, award }) {
  if (hasBadgeImage) {
    return (
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-rb-feather/50 opacity-60" />
        <img
          src={`${certificationBadgeUrl(certificationId)}?v=${encodeURIComponent(award?.badgeAwardedAt ?? "")}`}
          alt="Certification badge"
          className="size-36 rounded-full border-4 border-white object-cover shadow-lg ring-4 ring-rb-feather/30"
        />
      </div>
    )
  }

  return (
    <svg
      viewBox="0 0 180 180"
      className="size-36 drop-shadow-lg"
      aria-label="Certification complete stamp"
    >
      <circle cx="90" cy="90" r="84" fill="none" stroke="#2f6b4f" strokeWidth="3" strokeDasharray="6 4" />
      <circle cx="90" cy="90" r="76" fill="#2f6b4f" />
      <circle cx="90" cy="90" r="70" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
      <path id="topArc" d="M 28,90 A 62,62 0 0,1 152,90" fill="none" />
      <text fontSize="10" fontWeight="700" fill="#ffffff" letterSpacing="3" fontFamily="sans-serif">
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">· REBYU CERTIFIED ·</textPath>
      </text>
      <path d="M74 88 L85 100 L108 75" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="90" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ffffff" fontFamily="sans-serif" letterSpacing="1">
        CERTIFIED
      </text>
      <text x="90" y="133" textAnchor="middle" fontSize="10" fontWeight="700" fill="#b6e8c9" fontFamily="sans-serif" letterSpacing="2">
        COMPLETE
      </text>
      <path id="btmArc" d="M 22,90 A 68,68 0 0,0 158,90" fill="none" />
      <text fontSize="9" fontWeight="600" fill="#b6e8c9" letterSpacing="2" fontFamily="sans-serif">
        <textPath href="#btmArc" startOffset="50%" textAnchor="middle">WELL DONE</textPath>
      </text>
      {[[40, 134], [140, 134]].map(([x, y]) => (
        <path key={x} d={faStar.icon[4]} fill="#b6e8c9" transform={`translate(${x - 5} ${y - 5}) scale(${10 / 576})`} />
      ))}
    </svg>
  )
}


function EarnedCard({ icon: Icon, label, value, sub, tone = "feather", valueClassName = "text-base" }) {
  const tones = {
    feather: { bg: "bg-rb-feather/10", ring: "ring-rb-feather/25", ink: "var(--color-rb-feather)" },
    bee:     { bg: "bg-rb-bee/15",     ring: "ring-rb-bee/35",     ink: "#b8860b" },
    macaw:   { bg: "bg-blue-500/10",   ring: "ring-blue-500/25",   ink: "#2563eb" },
  }
  const palette = tones[tone] ?? tones.feather

  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-border p-3.5 ring-1 ${palette.ring} ${palette.bg}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-background/80 shadow-sm">
        <Icon className="size-5" style={{ color: palette.ink }} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`break-words font-rb-display font-extrabold leading-tight ${valueClassName}`} style={{ color: palette.ink }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}


function AchievementChips({ achievements }) {
  if (!achievements.length) return null

  return (
    <section className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        <Medal className="size-4" aria-hidden />
        Badges unlocked
      </h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {achievements.map((achievement) => {
          const art = achievementBadge(achievement)
          return (
            <div
              key={achievementKey(achievement)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-center"
              title={achievement.description ?? ""}
            >
              {art ? (
                <img src={art} alt="" className="size-12 object-contain" />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-rb-bee/20">
                  <Medal className="size-6 text-rb-eel" aria-hidden />
                </span>
              )}
              <p className="line-clamp-2 text-xs font-bold leading-tight text-foreground">{achievement.title}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}


export function CertificationCompletionModal({ certification, award, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    playAchievementChime()
  }, [])

  const certId = certification?.certificationId ?? certification?.id
  const certTitle = certification?.title ?? "Certification"
  const firstName = String(getCurrentLearnerIdentity().name ?? "").trim().split(/\s+/)[0] || null

  const rewardsQ = useQuery({
    queryKey: ["completion-rewards"],
    queryFn: getMyRewards,
    staleTime: 60_000,
  })

  const totalXp = rewardsQ.data?.totalXp ?? null

  const recentAchievements = useMemo(() => {
    const list = Array.isArray(rewardsQ.data?.achievements) ? rewardsQ.data.achievements : []
    return list
      .filter((a) => a?.earned)
      .sort((a, b) => new Date(b.earnedAt ?? 0) - new Date(a.earnedAt ?? 0))
      .slice(0, 4)
  }, [rewardsQ.data])

  const score = award?.scorePercentage != null ? Math.round(Number(award.scorePercentage)) : null

  const certDate = award?.certificateAwardedAt
    ? new Date(award.certificateAwardedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : award?.badgeAwardedAt
      ? new Date(award.badgeAwardedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <Confetti fire={String(certId ?? "cert")} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${certTitle} complete`}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-border bg-background shadow-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
      >

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid size-8 place-items-center rounded-full border border-white/40 bg-white/15 text-white transition hover:bg-white/25"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="relative overflow-hidden bg-rb-feather px-6 pb-9 pt-10 text-center text-white">
          <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-white/5" />

          <motion.p
            className="relative z-10 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Certification complete
          </motion.p>

          <motion.h2
            className="relative z-10 mt-3 font-rb-display text-3xl font-extrabold leading-tight text-white sm:text-4xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
          >
            Congratulations{firstName ? `, ${firstName}` : ""}!
          </motion.h2>

          <motion.div
            className="relative z-10 mt-5 flex justify-center"
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.24, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="relative">
              <div className="pointer-events-none absolute -inset-5 rounded-full bg-white/15 blur-2xl" />
              <CompletionStamp
                hasBadgeImage={!!award?.hasBadgeImage}
                certificationId={certId}
                award={award}
              />
            </div>
          </motion.div>

          <p className="relative z-10 mt-4 text-sm opacity-85">You earned the badge for</p>
          <h3 className="relative z-10 font-rb-display text-2xl font-extrabold leading-tight text-white">
            {certTitle}
          </h3>
          {certification?.department && (
            <p className="relative z-10 mt-0.5 text-sm opacity-80">{certification.department}</p>
          )}

          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2">
            {score != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                <Trophy className="size-3.5" aria-hidden />
                Mock exam passed · {score}%
              </span>
            )}
            {certDate && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                Issued {certDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">

          <div className="grid gap-3 sm:grid-cols-3">
            <EarnedCard
              icon={Medal}
              label="Badge"
              value={certTitle}
              sub="added to your certification card"
              tone="bee"
            />
            <EarnedCard
              icon={Award}
              label="Certificate"
              value={award?.certificateNumber ?? "Issued"}
              sub={certDate ? `Issued ${certDate}` : "Ready to download"}
              tone="feather"
              valueClassName="text-sm tracking-tight"
            />
            <EarnedCard
              icon={Zap}
              label="Total XP"
              value={totalXp != null ? <CountUp value={Number(totalXp)} /> : "—"}
              sub={totalXp != null ? "experience earned so far" : "no XP recorded yet"}
              tone="macaw"
            />
          </div>

          <AchievementChips achievements={recentAchievements} />

          <div className="mt-7 space-y-2.5 border-t border-border pt-5">
            <Button
              size="lg"
              className="w-full"
              style={{ background: "var(--color-rb-feather)", color: "#fff" }}
              onClick={() => { onClose(); navigate(`/learner/certifications/${certId}/certificate`) }}
            >
              <Award className="mr-2 size-4" />
              View Certificate
            </Button>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <Button
                variant="outline"
                className="w-full border-2"
                onClick={() => { onClose(); navigate(`/learner/learning/${certId}`) }}
              >
                <BookOpen className="mr-1.5 size-4" />
                Curriculum
              </Button>
              <Button
                variant="outline"
                className="w-full border-2"
                onClick={() => { onClose(); navigate(`/learner/certifications/${certId}`) }}
              >
                <GraduationCap className="mr-1.5 size-4" />
                Details
              </Button>
              <Button
                variant="outline"
                className="w-full border-2 border-rb-bee text-rb-eel hover:bg-rb-bee-wash"
                onClick={() => { onClose(); navigate("/learner/certifications") }}
              >
                <Award className="mr-1.5 size-4" />
                All Certifications
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
