import React, { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
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
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Layers3,
  TrendingDown,
  TrendingUp,
  Zap,
} from "@/components/icons"
import { Button } from "@/components/ui/button"
import { certificationBadgeUrl } from "@/services/certificationService.js"
import { getMyAwards, getCurrentLearnerIdentity } from "@/services/learnerService.js"
import { getProgressAnalytics } from "@/services/learnerAnalyticsService.js"
import { masteryColor, useChartTheme } from "@/components/charts/rebyu-charts.jsx"

/* ── helpers ──────────────────────────────────────────────────────────────── */

function scoreLabel(n) {
  if (n == null) return "No data"
  const v = Number(n)
  if (v >= 80) return "Advanced"
  if (v >= 60) return "Proficient"
  if (v >= 40) return "Developing"
  return "Novice"
}

function bandColor(v) {
  if (v == null) return "#AFAFAF"
  const n = Number(v)
  if (n >= 80) return "#2f6b4f"
  if (n >= 60) return "#3b82f6"
  if (n >= 40) return "#c9962b"
  return "#c8553d"
}

function fmtDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function priorityLabel(tag) {
  if (!tag) return { text: "Medium", cls: "text-yellow-700 bg-yellow-50 border-yellow-200" }
  if (tag.includes("CRITICAL")) return { text: "Critical", cls: "text-red-700 bg-red-50 border-red-200" }
  if (tag.includes("HIGH")) return { text: "High", cls: "text-orange-700 bg-orange-50 border-orange-200" }
  return { text: "Medium", cls: "text-yellow-700 bg-yellow-50 border-yellow-200" }
}

function deriveAssessmentInsights(scoreTrend) {
  if (!Array.isArray(scoreTrend) || !scoreTrend.length) return {}
  const byExam = {}
  for (const pt of scoreTrend) {
    const id = pt.examId ?? pt.assessmentTitle
    if (!byExam[id]) byExam[id] = { title: pt.assessmentTitle, attempts: 0, scores: [], wrongs: [] }
    byExam[id].attempts++
    if (pt.percentage != null) byExam[id].scores.push(Number(pt.percentage))
    if (pt.correctCount != null && pt.itemCount != null)
      byExam[id].wrongs.push(pt.itemCount - pt.correctCount)
  }
  const list = Object.values(byExam)
  const mostAttempted = [...list].sort((a, b) => b.attempts - a.attempts)[0]
  const bestScore = [...list].filter(e => e.scores.length).sort((a, b) => Math.max(...b.scores) - Math.max(...a.scores))[0]
  const worstScore = [...list].filter(e => e.scores.length).sort((a, b) => Math.min(...a.scores) - Math.min(...b.scores))[0]
  const mostWrong = [...list].filter(e => e.wrongs.length).sort((a, b) => Math.max(...b.wrongs) - Math.max(...a.wrongs))[0]
  return { mostAttempted, bestScore, worstScore, mostWrong }
}

/* ── certificate badge seal (stamp) ───────────────────────────────────────── */

function CertStamp({ certificationId, award }) {
  // Always try the certification's own badge; the drawn seal is only the
  // fallback for a certification that has no badge uploaded (the endpoint 404s).
  const [badgeFailed, setBadgeFailed] = React.useState(false)
  const hasBadgeImage = !badgeFailed
  return (
    <div className="relative flex size-full items-center justify-center">
      <svg viewBox="0 0 140 140" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="70" cy="70" r="67" fill="none" stroke="#1a5c3a" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.35" />
        <circle cx="70" cy="70" r="60" fill="none" stroke="#1a5c3a" strokeWidth="0.75" opacity="0.2" />
      </svg>
      {hasBadgeImage ? (
        <img
          src={`${certificationBadgeUrl(certificationId)}?v=${encodeURIComponent(award?.badgeAwardedAt ?? "")}`}
          alt={`${award?.certificationTitle ?? "Certification"} badge`}
          onError={() => setBadgeFailed(true)}
          className="relative z-10 size-[76%] rounded-full border-[3px] border-white object-cover"
          style={{ boxShadow: "0 0 0 3px rgba(26,92,58,0.18), 0 4px 20px rgba(0,0,0,0.15)" }}
        />
      ) : (
        <svg viewBox="0 0 106 106" className="relative z-10 size-[76%]" aria-hidden="true">
          <circle cx="53" cy="53" r="51" fill="#1a5c3a" />
          <circle cx="53" cy="53" r="44" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <path id="sTa2" d="M 5,53 A 48,48 0 0,1 101,53" fill="none" />
          <text fontSize="7" fontWeight="700" fill="#fff" letterSpacing="3" fontFamily="sans-serif">
            <textPath href="#sTa2" startOffset="50%" textAnchor="middle">· REBYU CERTIFIED ·</textPath>
          </text>
          <path d="M36,53 L47,64 L70,41" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="53" y="83" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff" fontFamily="sans-serif" letterSpacing="1">CERTIFIED</text>
          <path id="sBa2" d="M 5,53 A 48,48 0 0,0 101,53" fill="none" />
          <text fontSize="6.5" fontWeight="600" fill="#b6e8c9" letterSpacing="2" fontFamily="sans-serif">
            <textPath href="#sBa2" startOffset="50%" textAnchor="middle">★ WELL DONE ★</textPath>
          </text>
        </svg>
      )}
    </div>
  )
}

/* ── ornamental frame corner ───────────────────────────────────────────── */

function FrameCorner({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={`pointer-events-none absolute size-[4cqw] ${className}`} aria-hidden="true">
      <path d="M2 38 V2 H38" fill="none" stroke="#1a5c3a" strokeWidth="2.5" />
      <path d="M8 38 V8 H38" fill="none" stroke="#1a5c3a" strokeWidth="1" opacity="0.5" />
      <circle cx="8" cy="8" r="2.2" fill="#1a5c3a" />
    </svg>
  )
}

/* ── section header ───────────────────────────────────────────────────────── */

function SectionHead({ icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-border pb-2.5">
      {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">{children}</h3>
    </div>
  )
}

/* ── insight card ─────────────────────────────────────────────────────────── */

function InsightCard({ icon: Icon, iconColor, label, title, subtitle, badge }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md" style={{ background: iconColor + "18" }}>
        <Icon className="size-4" style={{ color: iconColor }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-foreground">{title ?? "—"}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {badge != null && (
        <p className="shrink-0 text-sm font-extrabold" style={{ color: bandColor(badge) }}>{badge}%</p>
      )}
    </div>
  )
}

/* ── module mastery bar chart ─────────────────────────────────────────────── */

function CategoryChart({ rows, theme }) {
  const majors = (rows ?? []).filter(r => r.categoryLevel === "MAJOR")
  if (!majors.length) return <p className="text-sm text-muted-foreground">No module data available.</p>
  const data = majors.map(r => ({
    name: r.title.length > 22 ? r.title.slice(0, 20) + "…" : r.title,
    full: r.title,
    mastery: r.masteryPercentage != null ? Math.round(Number(r.masteryPercentage)) : 0,
    completed: r.completedLessonCount,
    total: r.totalLessonCount,
  }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 48, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: theme.ink.secondary }} tickFormatter={v => `${v}%`} />
        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: theme.ink.primary }} />
        <Tooltip
          formatter={(v, _, p) => [`${v}% · ${scoreLabel(v)} (${p.payload.completed}/${p.payload.total} lessons)`, p.payload.full]}
          contentStyle={{ background: theme.surface, border: `1px solid ${theme.grid}`, borderRadius: 6, fontSize: 11 }}
        />
        <Bar dataKey="mastery" radius={[0, 3, 3, 0]} maxBarSize={18} label={{ position: "right", fontSize: 10, fill: theme.ink.secondary, formatter: v => `${v}%` }}>
          {data.map((d, i) => <Cell key={i} fill={masteryColor(theme, d.mastery)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── main page ────────────────────────────────────────────────────────────── */

export default function LearnerCertificatePage() {
  const { certificationId } = useParams()
  const navigate = useNavigate()
  const theme = useChartTheme()

  const identity = useMemo(() => getCurrentLearnerIdentity(), [])

  const analyticsQ = useQuery({
    queryKey: ["cert-certificate-analytics", certificationId],
    queryFn: () => getProgressAnalytics(certificationId),
    staleTime: 60_000,
    enabled: !!certificationId,
  })

  const awardsQ = useQuery({
    queryKey: ["learner-awards"],
    queryFn: getMyAwards,
    staleTime: 60_000,
  })

  const award = useMemo(() => {
    const list = Array.isArray(awardsQ.data) ? awardsQ.data : []
    return list.find(a => String(a.certificationId) === String(certificationId))
  }, [awardsQ.data, certificationId])

  const d = analyticsQ.data ?? {}
  const isLoading = analyticsQ.isLoading || awardsQ.isLoading

  const noAward = !awardsQ.isLoading && !award?.badgeAwardedAt
  React.useEffect(() => {
    if (noAward) navigate(`/learner/certifications/${certificationId}`, { replace: true })
  }, [noAward, certificationId, navigate])

  const overallPct = d.overallMasteryPercentage != null ? Math.round(d.overallMasteryPercentage) : null
  const avgScore = d.averageAssessmentScore != null ? Math.round(d.averageAssessmentScore) : null

  // Mock exam score: best (highest) attempt across all mock exam submissions.
  const mockExamPct = useMemo(() => {
    const mockAttempts = (d.scoreTrend ?? []).filter(
      pt => pt.assessmentType === "MOCK_EXAM" || pt.assessmentType === "MOCK"
    )
    if (!mockAttempts.length) return null
    return Math.round(Math.max(...mockAttempts.map(pt => Number(pt.percentage ?? 0))))
  }, [d.scoreTrend])
  const certTitle = d.certificationTitle ?? award?.certificationTitle ?? "Certification"
  const certDate = award?.certificateAwardedAt ?? award?.badgeAwardedAt
  const learnerName = identity?.name || "Learner"

  const { mostAttempted, bestScore, worstScore, mostWrong } = useMemo(
    () => deriveAssessmentInsights(d.scoreTrend),
    [d.scoreTrend]
  )

  const highestLesson = d.strongestTopics?.[0]
  const lowestLesson = d.weakestTopics?.[0]
  const totalAnswers = (d.totalCorrectAnswers ?? 0) + (d.totalIncorrectAnswers ?? 0)
  const accuracyPct = totalAnswers > 0 ? Math.round((d.totalCorrectAnswers / totalAnswers) * 100) : null

  const [view, setView] = React.useState("badge")

  if (noAward) return null

  const SERIF = 'Georgia, "Times New Roman", serif'
  const GREEN = "#1a5c3a"
  // Sizes are in cqw of the document itself, so the whole sheet scales as one
  // piece to whatever room the viewport leaves -- the floor keeps phones legible.
  const sz = (cqw, min) => `max(${min}px, ${cqw}cqw)`

  const stats = [
    { label: "Overall Mastery", value: overallPct != null ? `${overallPct} / 100` : "—", note: overallPct != null ? scoreLabel(overallPct) : null },
    { label: "Avg. Assessment Score", value: avgScore != null ? `${avgScore} / 100` : "—", note: avgScore != null ? scoreLabel(avgScore) : null },
    { label: "Mock Exam Score", value: mockExamPct != null ? `${mockExamPct} / 100` : "—", note: mockExamPct != null ? `${scoreLabel(mockExamPct)} · best attempt` : null },
    { label: "Proficiency", value: overallPct != null ? scoreLabel(overallPct) : "—", note: overallPct != null ? `${overallPct} / 100` : null },
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 lg:h-[calc(100dvh-8.5rem)]">
      {/* ── toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/learner/certifications")}
          className="mr-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Certifications
        </button>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="tablist">
          {[
            { key: "badge", label: "Badge" },
            { key: "summary", label: "Performance Summary" },
          ].map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={view === t.key}
              onClick={() => setView(t.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                view === t.key ? "bg-[var(--color-rb-feather)] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate(`/learner/learning/${certificationId}`)}>
          <BookOpen className="mr-1.5 size-4" />
          Curriculum
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/learner/certifications/${certificationId}`)}>
          <GraduationCap className="mr-1.5 size-4" />
          Details
        </Button>
      </div>

      {view === "badge" ? (
        /* ══ FORMAL BADGE OF COMPLETION ═══════════════════════════════════
           Landscape A-series sheet (1.414 : 1) fitted to the room left. */
        <div className="flex min-h-0 flex-1 items-center justify-center lg:[container-type:size]">
          <article
            className="w-full bg-white p-[6px] lg:aspect-[1.414/1] lg:w-[min(100cqw,calc(100cqh*1.414))]"
            style={{ border: "1px solid #c8d6cc", boxShadow: "0 4px 28px rgba(0,0,0,0.10)" }}
          >
            <div className="h-full [container-type:inline-size]" style={{ border: `4px double ${GREEN}` }}>
              <div
                className="relative flex h-full flex-col items-center justify-between text-center"
                style={{ padding: "3cqw 6cqw 2.2cqw", gap: "1.2cqw" }}
              >
                <FrameCorner className="left-[1cqw] top-[1cqw]" />
                <FrameCorner className="right-[1cqw] top-[1cqw] rotate-90" />
                <FrameCorner className="bottom-[1cqw] right-[1cqw] rotate-180" />
                <FrameCorner className="bottom-[1cqw] left-[1cqw] -rotate-90" />

                {/* heading */}
                <header className="flex flex-col items-center">
                  <p className="font-bold uppercase" style={{ fontSize: sz(1.05, 9), letterSpacing: "0.45em", color: GREEN }}>
                    REBYU Learning
                  </p>
                  <div className="flex items-center justify-center" style={{ gap: "0.8cqw", margin: "0.9cqw 0 1.1cqw" }}>
                    <span style={{ height: 1, width: "6cqw", background: GREEN, opacity: 0.4 }} />
                    <span style={{ width: 6, height: 6, transform: "rotate(45deg)", background: GREEN, opacity: 0.7 }} />
                    <span style={{ height: 1, width: "6cqw", background: GREEN, opacity: 0.4 }} />
                  </div>
                  <h1 style={{ fontFamily: SERIF, fontSize: sz(4.4, 28), color: GREEN, lineHeight: 1.05, fontWeight: 700, letterSpacing: "0.01em" }}>
                    Badge of Completion
                  </h1>
                  <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(1.35, 12), color: "#6b7280", marginTop: "0.8cqw" }}>
                    This formally acknowledges that
                  </p>
                </header>

                {/* recipient */}
                <section className="flex w-full flex-col items-center">
                  {isLoading ? (
                    <div className="h-10 w-64 animate-pulse rounded bg-muted/40" />
                  ) : (
                    <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(3.9, 26), color: "#111827", lineHeight: 1.15 }}>
                      {learnerName}
                    </p>
                  )}
                  <div style={{ height: 1, width: "44%", background: GREEN, opacity: 0.35, margin: "0.6cqw 0 1cqw" }} />
                  <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(1.35, 12), color: "#6b7280" }}>
                    has achieved the badge of completion for
                  </p>
                  {isLoading ? (
                    <div className="mt-2 h-7 w-72 animate-pulse rounded bg-muted/40" />
                  ) : (
                    <p className="font-bold uppercase" style={{ fontFamily: SERIF, fontSize: sz(2.2, 16), color: "#111827", letterSpacing: "0.06em", marginTop: "0.5cqw" }}>
                      {certTitle}
                    </p>
                  )}
                </section>

                {/* record of achievement */}
                <dl
                  className="grid w-full grid-cols-2 sm:grid-cols-4"
                  style={{ borderTop: "1px solid #dce8e2", borderBottom: "1px solid #dce8e2", padding: "0.9cqw 0" }}
                >
                  {stats.map((s, i) => (
                    <div key={s.label} className="px-2 py-1" style={{ borderLeft: i % 4 ? "1px solid #eef2ef" : "none" }}>
                      <dt className="font-bold uppercase" style={{ fontSize: sz(0.8, 8), letterSpacing: "0.16em", color: "#6b7280" }}>
                        {s.label}
                      </dt>
                      <dd style={{ fontFamily: SERIF, fontSize: sz(1.55, 13), color: "#111827", fontWeight: 700, marginTop: "0.3cqw" }}>
                        {isLoading ? <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted/40" /> : s.value}
                        {!isLoading && s.note ? (
                          <span className="block italic" style={{ fontSize: sz(0.95, 10), color: "#6b7280", fontWeight: 400 }}>{s.note}</span>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* date line · certification badge · number line */}
                <footer className="grid w-full grid-cols-[1fr_auto_1fr] items-end" style={{ gap: "4cqw" }}>
                  <div>
                    <p style={{ fontFamily: SERIF, fontSize: sz(1.4, 12), color: "#111827" }}>{fmtDate(certDate)}</p>
                    <div style={{ height: 1, background: "#374151", opacity: 0.5, margin: "0.5cqw 0" }} />
                    <p className="font-bold uppercase" style={{ fontSize: sz(0.8, 8), letterSpacing: "0.16em", color: "#6b7280" }}>Date of Completion</p>
                  </div>
                  <div style={{ width: sz(11.5, 84), height: sz(11.5, 84) }}>
                    {isLoading ? (
                      <div className="size-full animate-pulse rounded-full bg-muted/30" />
                    ) : (
                      <CertStamp certificationId={certificationId} award={award} />
                    )}
                  </div>
                  <div>
                    <p className="tabular-nums" style={{ fontFamily: SERIF, fontSize: sz(1.4, 12), color: "#111827" }}>{award?.certificateNumber ?? "—"}</p>
                    <div style={{ height: 1, background: "#374151", opacity: 0.5, margin: "0.5cqw 0" }} />
                    <p className="font-bold uppercase" style={{ fontSize: sz(0.8, 8), letterSpacing: "0.16em", color: "#6b7280" }}>Badge No.</p>
                  </div>
                </footer>

                <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(0.95, 10), color: "#9ca3af" }}>
                  Issued by the REBYU Learning Platform in recognition of successful completion and mastery of the program named above.
                </p>
              </div>
            </div>
          </article>
        </div>
      ) : (
        /* ══ PERFORMANCE SUMMARY ═══════════════════════════════════════════ */
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-5">
            <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-44 animate-pulse rounded-xl bg-muted/40" />
          </div>
          <div className="space-y-5">
            <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">

          {/* LEFT */}
          <div className="space-y-5">

            {/* Module Mastery */}
            <div className="rounded-xl border border-border bg-card p-5">
              <SectionHead icon={Layers3}>Module Mastery</SectionHead>
              <CategoryChart rows={d.categoryMastery} theme={theme} />
            </div>

            {/* Assessment Insights */}
            <div className="rounded-xl border border-border bg-card p-5">
              <SectionHead icon={Zap}>Assessment Insights</SectionHead>
              <div className="space-y-2.5">
                <InsightCard
                  icon={AlertTriangle}
                  iconColor="#c8553d"
                  label="Most Attempted"
                  title={mostAttempted?.title}
                  subtitle={mostAttempted ? `${mostAttempted.attempts} attempt${mostAttempted.attempts !== 1 ? "s" : ""}` : undefined}
                />
                <InsightCard
                  icon={TrendingUp}
                  iconColor="#2f6b4f"
                  label="Best Performing Assessment"
                  title={bestScore?.title}
                  subtitle={bestScore?.scores?.length ? `${Math.round(Math.max(...bestScore.scores))} / 100 highest score` : undefined}
                  badge={bestScore?.scores?.length ? Math.round(Math.max(...bestScore.scores)) : null}
                />
                <InsightCard
                  icon={TrendingDown}
                  iconColor="#c9962b"
                  label="Needs Most Improvement"
                  title={worstScore?.title}
                  subtitle={worstScore?.scores?.length ? `${Math.round(Math.min(...worstScore.scores))} / 100 lowest score` : undefined}
                  badge={worstScore?.scores?.length ? Math.round(Math.min(...worstScore.scores)) : null}
                />
                {mostWrong && (
                  <InsightCard
                    icon={AlertTriangle}
                    iconColor="#c8553d"
                    label="Highest Wrong Answers (single attempt)"
                    title={mostWrong.title}
                    subtitle={`${Math.max(...mostWrong.wrongs)} incorrect answer${Math.max(...mostWrong.wrongs) !== 1 ? "s" : ""}`}
                  />
                )}
                {accuracyPct != null && (
                  <div className="mt-1 rounded-lg border border-border bg-background px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Overall Answer Accuracy</p>
                        <p className="text-xs text-muted-foreground">
                          {d.totalCorrectAnswers} correct · {d.totalIncorrectAnswers} incorrect · {totalAnswers} total
                        </p>
                      </div>
                      <p className="text-xl font-extrabold" style={{ color: bandColor(accuracyPct) }}>{accuracyPct}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">

            {/* Areas to Improve */}
            <div className="rounded-xl border border-border bg-card p-5">
              <SectionHead icon={AlertTriangle}>
                Areas to Improve
                {d.weakestTopics?.length > 0 && (
                  <span className="ml-1.5 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                    {d.weakestTopics.length} total
                  </span>
                )}
              </SectionHead>
              {!d.weakestTopics?.length ? (
                <p className="text-sm text-muted-foreground">No weak areas recorded — strong overall mastery.</p>
              ) : (
                <div className="divide-y divide-border">
                  {d.weakestTopics.slice(0, 5).map((t, i) => {
                    const m = t.masteryPercentage != null ? Math.round(Number(t.masteryPercentage)) : null
                    const p = priorityLabel(t.priorityTag)
                    return (
                      <div key={i} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-extrabold text-muted-foreground">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{t.lessonTitle}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{t.categoryTitle ?? ""}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {m != null && <p className="text-sm font-extrabold" style={{ color: bandColor(m) }}>{m}%</p>}
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${p.cls}`}>{p.text}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Lesson Mastery Highlights */}
            <div className="rounded-xl border border-border bg-card p-5">
              <SectionHead icon={BookOpen}>Lesson Mastery Highlights</SectionHead>
              <div className="space-y-2.5">
                <InsightCard
                  icon={TrendingUp}
                  iconColor="#2f6b4f"
                  label="Highest Mastery Lesson"
                  title={highestLesson?.lessonTitle}
                  subtitle={highestLesson?.categoryTitle}
                  badge={highestLesson?.masteryPercentage != null ? Math.round(Number(highestLesson.masteryPercentage)) : null}
                />
                <InsightCard
                  icon={TrendingDown}
                  iconColor="#c8553d"
                  label="Lowest Mastery Lesson"
                  title={lowestLesson?.lessonTitle}
                  subtitle={lowestLesson?.categoryTitle}
                  badge={lowestLesson?.masteryPercentage != null ? Math.round(Number(lowestLesson.masteryPercentage)) : null}
                />
              </div>
            </div>

          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}
