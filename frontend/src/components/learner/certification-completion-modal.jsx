import React, { useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BookOpen,
  X,
  Award,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Layers3,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { certificationBadgeUrl } from "@/services/certificationService.js"
import {
  getProgressAnalytics,
  getMyPriorities,
  getMyConfidence,
  flattenPriorityAreas,
  PRIORITY_META,
  comparePriority,
} from "@/services/learnerAnalyticsService.js"
import { masteryColor, useChartTheme } from "@/components/charts/rebyu-charts.jsx"

/* ── helpers ──────────────────────────────────────────────────────────────── */

function pct(n) {
  return n == null ? "—" : `${Math.round(Number(n))}%`
}

function scoreLabel(n) {
  if (n == null) return "—"
  const v = Math.round(Number(n))
  if (v >= 75) return "Strong"
  if (v >= 50) return "Developing"
  return "Weak"
}

function priorityBg(tag) {
  switch (tag) {
    case "CRITICAL_PRIORITY": return "bg-red-100 text-red-700 border-red-300"
    case "HIGH_PRIORITY":     return "bg-orange-100 text-orange-700 border-orange-300"
    case "MEDIUM_PRIORITY":   return "bg-yellow-100 text-yellow-700 border-yellow-300"
    case "LOW_PRIORITY":      return "bg-blue-100 text-blue-700 border-blue-300"
    case "ON_TRACK":          return "bg-green-100 text-green-700 border-green-300"
    case "STRONG":            return "bg-emerald-100 text-emerald-700 border-emerald-300"
    default:                  return "bg-muted text-muted-foreground border-border"
  }
}

/* ── stamp SVG ────────────────────────────────────────────────────────────── */

function CompletionStamp({ hasBadgeImage, certificationId, award }) {
  if (hasBadgeImage) {
    return (
      <div className="relative flex items-center justify-center">
        {/* outer ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-rb-feather/50 opacity-60" />
        <img
          src={`${certificationBadgeUrl(certificationId)}?v=${encodeURIComponent(award?.badgeAwardedAt ?? "")}`}
          alt="Certification badge"
          className="size-36 rounded-full border-4 border-white object-cover shadow-lg ring-4 ring-rb-feather/30"
        />
      </div>
    )
  }

  /* Drawn stamp — no badge image uploaded */
  return (
    <svg
      viewBox="0 0 180 180"
      className="size-36 drop-shadow-lg"
      aria-label="Certification complete stamp"
    >
      {/* outer dashed ring */}
      <circle cx="90" cy="90" r="84" fill="none" stroke="#2f6b4f" strokeWidth="3" strokeDasharray="6 4" />
      {/* filled disc */}
      <circle cx="90" cy="90" r="76" fill="#2f6b4f" />
      {/* inner ring */}
      <circle cx="90" cy="90" r="70" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
      {/* top arc text: REBYU */}
      <path id="topArc" d="M 28,90 A 62,62 0 0,1 152,90" fill="none" />
      <text fontSize="10" fontWeight="700" fill="#ffffff" letterSpacing="3" fontFamily="sans-serif">
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">· REBYU CERTIFIED ·</textPath>
      </text>
      {/* check mark */}
      <path d="M74 88 L85 100 L108 75" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* CERTIFIED big text */}
      <text x="90" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ffffff" fontFamily="sans-serif" letterSpacing="1">
        CERTIFIED
      </text>
      <text x="90" y="133" textAnchor="middle" fontSize="10" fontWeight="700" fill="#b6e8c9" fontFamily="sans-serif" letterSpacing="2">
        COMPLETE
      </text>
      {/* bottom arc text */}
      <path id="btmArc" d="M 22,90 A 68,68 0 0,0 158,90" fill="none" />
      <text fontSize="9" fontWeight="600" fill="#b6e8c9" letterSpacing="2" fontFamily="sans-serif">
        <textPath href="#btmArc" startOffset="50%" textAnchor="middle">★ WELL DONE ★</textPath>
      </text>
    </svg>
  )
}

/* ── module bar chart ─────────────────────────────────────────────────────── */

function ModuleChart({ areas, theme }) {
  const majorAreas = areas.filter(a => a.categoryType === "MAJOR")
  if (!majorAreas.length) return null

  const data = majorAreas.map(a => ({
    name: a.title.length > 18 ? a.title.slice(0, 16) + "…" : a.title,
    fullName: a.title,
    score: a.masteryProbability != null
      ? Math.round(Number(a.masteryProbability) * 100)
      : a.priorityScore != null
        ? Math.round(Number(a.priorityScore))
        : 0,
    tag: a.priorityTag,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 32, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: theme.ink.secondary }} tickFormatter={v => `${v}%`} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: theme.ink.primary }} />
        <Tooltip
          formatter={(v, _, props) => [`${v}% · ${scoreLabel(v)}`, props.payload.fullName]}
          contentStyle={{ background: theme.surface, border: `1px solid ${theme.grid}`, borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={masteryColor(theme, d.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── lesson weakness list ─────────────────────────────────────────────────── */

function WeaknessList({ areas }) {
  const weakLessons = areas
    .filter(a => a.categoryType === "LESSON")
    .sort(comparePriority)
    .slice(0, 8)

  if (!weakLessons.length) return (
    <p className="text-sm text-muted-foreground">No lesson data available yet.</p>
  )

  return (
    <div className="space-y-2">
      {weakLessons.map((lesson, i) => {
        const meta = PRIORITY_META[lesson.priorityTag]
        const mastery = lesson.masteryProbability != null
          ? Math.round(Number(lesson.masteryProbability) * 100)
          : null
        return (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{lesson.title}</p>
              {lesson.primaryReason && (
                <p className="truncate text-xs text-muted-foreground">{lesson.primaryReason}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {mastery != null && (
                <span className="text-xs font-bold" style={{ color: mastery >= 75 ? "#2f6b4f" : mastery >= 50 ? "#c9962b" : "#c8553d" }}>
                  {mastery}%
                </span>
              )}
              {meta && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityBg(lesson.priorityTag)}`}>
                  {meta.label}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── stat tile ────────────────────────────────────────────────────────────── */

function StatTile({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <p className="font-rb-display text-2xl font-extrabold" style={{ color: accent ?? "var(--color-rb-feather-ink)" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

/* ── main modal ───────────────────────────────────────────────────────────── */

export function CertificationCompletionModal({ certification, award, onClose }) {
  const navigate = useNavigate()
  const theme = useChartTheme()

  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const certId = certification?.certificationId ?? certification?.id
  const certTitle = certification?.title ?? "Certification"

  const analyticsQ = useQuery({
    queryKey: ["completion-analytics", certId],
    queryFn: () => getProgressAnalytics(certId),
    staleTime: 30_000,
    enabled: !!certId,
  })

  const prioritiesQ = useQuery({
    queryKey: ["completion-priorities", certId],
    queryFn: () => getMyPriorities(certId),
    staleTime: 60_000,
    enabled: !!certId,
  })

  const confidenceQ = useQuery({
    queryKey: ["completion-confidence", certId],
    queryFn: () => getMyConfidence(certId),
    staleTime: 60_000,
    enabled: !!certId,
  })

  const analytics = analyticsQ.data ?? {}
  const areas = useMemo(() => flattenPriorityAreas(prioritiesQ.data), [prioritiesQ.data])
  const confidence = confidenceQ.data ?? {}

  const completedLessons = analytics.completedLessons ?? 0
  const totalLessons = analytics.totalLessons ?? 0
  const passedAssessments = analytics.passedAssessments ?? 0
  const totalAssessments = analytics.totalAssessments ?? 0

  const overallMastery = confidence.overallMastery != null
    ? Math.round(Number(confidence.overallMastery) * 100)
    : null

  const certDate = award?.certificateAwardedAt
    ? new Date(award.certificateAwardedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : award?.badgeAwardedAt
      ? new Date(award.badgeAwardedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : null

  const weakAreas = areas.filter(a =>
    a.categoryType === "LESSON" &&
    ["CRITICAL_PRIORITY", "HIGH_PRIORITY", "MEDIUM_PRIORITY"].includes(a.priorityTag)
  ).length

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-label={`${certTitle} complete`} className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-2 border-border bg-background shadow-2xl">

        {/* close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* hero header — green banner */}
        <div className="relative flex flex-col items-center gap-4 overflow-hidden bg-rb-feather px-6 pb-8 pt-10 text-white sm:flex-row sm:items-start sm:pb-10">
          {/* decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -left-6 bottom-0 size-24 rounded-full bg-white/5" />

          {/* stamp */}
          <div className="relative z-10 shrink-0">
            <CompletionStamp
              hasBadgeImage={!!award?.hasBadgeImage}
              certificationId={certId}
              award={award}
            />
          </div>

          {/* title block */}
          <div className="relative z-10 min-w-0 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.15em] opacity-75">
              Certification Complete
            </p>
            <h2 className="mt-1 font-rb-display text-2xl font-extrabold leading-tight text-white">
              {certTitle}
            </h2>
            {certification?.industry && (
              <p className="mt-1 text-sm opacity-80">{certification.industry}</p>
            )}
            {award?.certificateNumber && (
              <p className="mt-2 font-mono text-xs opacity-70">
                Certificate · <span className="font-semibold">{award.certificateNumber}</span>
              </p>
            )}
            {certDate && (
              <p className="mt-0.5 text-xs opacity-70">Issued {certDate}</p>
            )}
          </div>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">

          {/* stat row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={BookOpen}
              label="Lessons"
              value={`${completedLessons}/${totalLessons}`}
              sub="completed"
              accent="#2f6b4f"
            />
            <StatTile
              icon={CheckCircle}
              label="Assessments"
              value={`${passedAssessments}/${totalAssessments}`}
              sub="passed"
              accent="#2f6b4f"
            />
            <StatTile
              icon={TrendingUp}
              label="Mastery"
              value={overallMastery != null ? `${overallMastery}%` : "—"}
              sub={overallMastery != null ? scoreLabel(overallMastery) : "not enough data"}
              accent={overallMastery != null ? (overallMastery >= 75 ? "#2f6b4f" : overallMastery >= 50 ? "#c9962b" : "#c8553d") : undefined}
            />
            <StatTile
              icon={AlertTriangle}
              label="Needs Review"
              value={weakAreas}
              sub={weakAreas === 1 ? "lesson area" : "lesson areas"}
              accent={weakAreas > 0 ? "#c8553d" : "#2f6b4f"}
            />
          </div>

          {/* module performance chart */}
          <section className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Layers3 className="size-4" aria-hidden />
              Module Performance
            </h3>
            {prioritiesQ.isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="size-6 animate-spin rounded-full border-2 border-rb-feather border-t-transparent" />
              </div>
            ) : areas.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-4">
                <ModuleChart areas={areas} theme={theme} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No module data available yet.</p>
            )}
          </section>

          {/* lesson weaknesses */}
          <section className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <AlertTriangle className="size-4" aria-hidden />
              Lesson Weaknesses &amp; Priority Areas
            </h3>
            {prioritiesQ.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : (
              <WeaknessList areas={areas} />
            )}
          </section>

          {/* overall confidence breakdown if available */}
          {(confidence.weakCount > 0 || confidence.strongCount > 0) && (
            <section className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="size-4" aria-hidden />
                Confidence Breakdown
              </h3>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>Weak</span>
                  <span>Developing</span>
                  <span>Strong</span>
                </div>
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
                  {confidence.weakCount > 0 && (
                    <div
                      className="flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${(confidence.weakCount / (confidence.weakCount + (confidence.developingCount ?? 0) + (confidence.strongCount ?? 0))) * 100}%`, background: "#c8553d" }}
                    >
                      {confidence.weakCount}
                    </div>
                  )}
                  {confidence.developingCount > 0 && (
                    <div
                      className="flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${(confidence.developingCount / (confidence.weakCount + confidence.developingCount + (confidence.strongCount ?? 0))) * 100}%`, background: "#c9962b" }}
                    >
                      {confidence.developingCount}
                    </div>
                  )}
                  {confidence.strongCount > 0 && (
                    <div
                      className="flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${(confidence.strongCount / ((confidence.weakCount ?? 0) + (confidence.developingCount ?? 0) + confidence.strongCount)) * 100}%`, background: "#2f6b4f" }}
                    >
                      {confidence.strongCount}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between text-xs font-semibold">
                  <span style={{ color: "#c8553d" }}>{confidence.weakCount ?? 0} weak</span>
                  <span style={{ color: "#c9962b" }}>{confidence.developingCount ?? 0} developing</span>
                  <span style={{ color: "#2f6b4f" }}>{confidence.strongCount ?? 0} strong</span>
                </div>
              </div>
            </section>
          )}

          {/* action buttons */}
          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button
              className="flex-1 sm:flex-none"
              style={{ background: "var(--color-rb-feather)", color: "#fff" }}
              onClick={() => { onClose(); navigate(`/learner/certifications/${certId}/certificate`) }}
            >
              <Award className="mr-1.5 size-4" />
              View Certificate
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-2"
              onClick={() => { onClose(); navigate(`/learner/learning/${certId}`) }}
            >
              <BookOpen className="mr-1.5 size-4" />
              View Curriculum
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-2"
              onClick={() => { onClose(); navigate(`/learner/certifications/${certId}`) }}
            >
              <GraduationCap className="mr-1.5 size-4" />
              Certification Details
            </Button>
            <Button
              variant="outline"
              className="ml-auto flex-none border-2 border-rb-bee text-rb-eel hover:bg-rb-bee-wash"
              onClick={() => { onClose(); navigate("/learner/certifications") }}
            >
              <Award className="mr-1.5 size-4" />
              Back to Certifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
