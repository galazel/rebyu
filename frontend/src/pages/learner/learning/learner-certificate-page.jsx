import "./learner-certificate.css"
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
  Download,
  GraduationCap,
  Layers3,
  TrendingDown,
  TrendingUp,
  Zap,
} from "@/components/icons"
import { certificationBadgeUrl } from "@/services/certificationService.js"
import { getMyAwards, getCurrentLearnerIdentity } from "@/services/learnerService.js"
import { getProgressAnalytics, progressAnalyticsQueryKey } from "@/services/learnerAnalyticsService.js"
import { masteryColor, useChartTheme } from "@/components/charts/rebyu-charts.jsx"
import { MockExamAnalytics } from "@/components/learner/mock-exam-analytics.jsx"


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
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function deriveMockExamSummary(scoreTrend) {
  const sittings = (scoreTrend ?? [])
    .filter((point) => ["MOCK_EXAM", "MOCK"].includes(String(point.assessmentType ?? "").toUpperCase()))
    .filter((point) => Number.isFinite(Number(point.percentage)))
    .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0))

  if (!sittings.length) return { latest: null, best: null, count: 0 }

  return {
    latest: sittings[0],
    best: sittings.reduce((best, point) =>
      Number(point.percentage) > Number(best.percentage) ? point : best,
    ),
    count: sittings.length,
  }
}

function priorityLabel(tag) {
  if (!tag) return { text: "Medium", cls: "text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30" }
  if (tag.includes("CRITICAL")) return { text: "Critical", cls: "text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-500/10 dark:border-red-500/30" }
  if (tag.includes("HIGH")) return { text: "High", cls: "text-orange-800 bg-orange-50 border-orange-200 dark:text-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30" }
  return { text: "Medium", cls: "text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30" }
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


function CertStamp({ certificationId, award }) {
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


function FrameCorner({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={`pointer-events-none absolute size-[4cqw] ${className}`} aria-hidden="true">
      <path d="M2 38 V2 H38" fill="none" stroke="#1a5c3a" strokeWidth="2.5" />
      <path d="M8 38 V8 H38" fill="none" stroke="#1a5c3a" strokeWidth="1" opacity="0.5" />
      <circle cx="8" cy="8" r="2.2" fill="#1a5c3a" />
    </svg>
  )
}


function SectionHead({ icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 border-b border-[var(--tg-line)] pb-3">
      {Icon && <span className="tg-badge-icon !size-8 !rounded-lg"><Icon className="size-4" aria-hidden /></span>}
      <h3 className="tg-kicker flex items-center">{children}</h3>
    </div>
  )
}


function InsightCard({ icon: Icon, iconColor, label, title, subtitle, badge }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--tg-line)] bg-card p-3.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md" style={{ background: iconColor + "18" }}>
        <Icon className="size-4" style={{ color: iconColor }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-bold text-foreground">{title ?? "—"}</p>
        {subtitle && <p className="break-words text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {badge != null && (
        <p className="shrink-0 text-sm font-extrabold" style={{ color: bandColor(badge) }}>{badge}%</p>
      )}
    </div>
  )
}


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


export default function LearnerCertificatePage() {
  const { certificationId } = useParams()
  const navigate = useNavigate()
  const theme = useChartTheme()

  const identity = useMemo(() => getCurrentLearnerIdentity(), [])

  const analyticsQ = useQuery({
    queryKey: progressAnalyticsQueryKey(String(certificationId)),
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
  // The stats wait on analytics (slow: it asks the mastery service); the name,
  // certification and badge only need the award, so they show as soon as it lands.
  const isLoading = analyticsQ.isLoading
  const awardLoading = awardsQ.isLoading

  const noAward = !awardsQ.isLoading && !award?.badgeAwardedAt
  React.useEffect(() => {
    if (noAward) navigate(`/learner/certifications/${certificationId}`, { replace: true })
  }, [noAward, certificationId, navigate])

  const overallPct = d.overallMasteryPercentage != null ? Math.round(d.overallMasteryPercentage) : null
  const avgScore = d.averageAssessmentScore != null ? Math.round(d.averageAssessmentScore) : null

  const mockExamSummary = useMemo(() => deriveMockExamSummary(d.scoreTrend), [d.scoreTrend])
  const latestMockPct = mockExamSummary.latest ? Math.round(Number(mockExamSummary.latest.percentage)) : null
  const bestMockPct = mockExamSummary.best ? Math.round(Number(mockExamSummary.best.percentage)) : null
  const certTitle = d.certificationTitle ?? award?.certificationTitle ?? "Certification"
  const certDate = award?.certificateAwardedAt ?? award?.badgeAwardedAt
  const credentialDateLabel = award?.certificateAwardedAt ? "Certificate issued" : "Badge earned"
  const learnerName = identity?.name || "Learner"

  const { mostAttempted, bestScore, worstScore, mostWrong } = useMemo(
    () => deriveAssessmentInsights(d.scoreTrend),
    [d.scoreTrend]
  )

  const highestLesson = d.strongestTopics?.[0]
  const lowestLesson = d.weakestTopics?.[0]
  const totalAnswers = (d.totalCorrectAnswers ?? 0) + (d.totalIncorrectAnswers ?? 0)
  const accuracyPct = totalAnswers > 0 ? Math.round((d.totalCorrectAnswers / totalAnswers) * 100) : null


  if (noAward) return null

  const SERIF = 'Georgia, "Times New Roman", serif'
  const GREEN = "#1a5c3a"
  const sz = (cqw, min) => `max(${min}px, ${cqw}cqw)`

  const stats = [
    { label: "Overall Mastery", value: overallPct != null ? `${overallPct} / 100` : "—", note: overallPct != null ? "Current mastery estimate" : null },
    { label: "Avg. Assessment Score", value: avgScore != null ? `${avgScore} / 100` : "—", note: avgScore != null ? "Across submitted assessments" : null },
    {
      label: "Latest Mock Exam",
      value: latestMockPct != null ? `${latestMockPct} / 100` : "—",
      note: mockExamSummary.latest ? `${fmtDate(mockExamSummary.latest.submittedAt)} · latest sitting` : "No submitted mock exam",
    },
    {
      label: "Best Mock Exam",
      value: bestMockPct != null ? `${bestMockPct} / 100` : "—",
      note: mockExamSummary.best
        ? `${fmtDate(mockExamSummary.best.submittedAt)} · best of ${mockExamSummary.count} ${mockExamSummary.count === 1 ? "sitting" : "sittings"}`
        : "No submitted mock exam",
    },
  ]

  return (
    <div className="certificate-page tg-cat-explain mx-auto w-full max-w-7xl pb-10">
      <button type="button" onClick={() => navigate("/learner/certifications")} className="tg-btn mb-6">
        <ArrowLeft className="size-4" aria-hidden="true" /> Certifications
      </button>

      <header className="credential-overview">
        <div className="credential-identity">
          <div className="size-20 shrink-0 sm:size-24"><CertStamp certificationId={certificationId} award={award} /></div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your credential</p>
            <h1 className="mt-2 break-words text-2xl font-bold leading-tight text-foreground sm:text-3xl">{certTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Awarded to <span className="font-semibold text-foreground">{learnerName}</span></p>
          </div>
        </div>
        <div className="credential-actions">
          <button type="button" className="credential-button credential-primary" onClick={() => window.print()} disabled={awardLoading}>
            <Download className="size-4" aria-hidden="true" /> Print or save PDF
          </button>
          <button type="button" className="credential-button" onClick={() => navigate(`/learner/learning/${certificationId}`)}><BookOpen className="size-4" aria-hidden="true" />Curriculum</button>
          <button type="button" className="credential-button" onClick={() => navigate(`/learner/certifications/${certificationId}`)}><GraduationCap className="size-4" aria-hidden="true" />Details</button>
        </div>
        <dl className="credential-metadata">
          <div><dt>Recipient</dt><dd>{learnerName}</dd></div>
          <div><dt>{credentialDateLabel}</dt><dd>{fmtDate(certDate)}</dd></div>
          <div><dt>Certificate number</dt><dd>{award?.certificateNumber ?? "—"}</dd></div>
        </dl>
      </header>
      <div className="mt-6">
        <div className="min-w-0 space-y-8">
          <section className="credential-preview" aria-labelledby="certificate-heading">
            <div className="mb-3 flex items-center gap-2.5 border-b border-[var(--tg-line)] pb-3">
              <span className="tg-badge-icon !size-8 !rounded-lg"><GraduationCap className="size-4" aria-hidden="true" /></span>
              <h2 id="certificate-heading" className="text-lg font-bold text-foreground">Certificate of completion</h2>
            </div>
            <div className="[container-type:inline-size]">
          <article
            id="rb-certificate"
            className="w-full p-[8px] sm:aspect-[1.414/1]"
            style={{
              border: "1px solid #c8d6cc",
              borderRadius: 6,
              background: "linear-gradient(135deg, #fdfcf7, #ffffff 45%, #f4f9f5)",
              boxShadow: "0 2px 0 #dfe9e2, 0 24px 48px -24px rgba(16,42,37,0.35)",
            }}
          >
            <div className="h-full [container-type:inline-size]" style={{ border: `4px double ${GREEN}`, borderRadius: 3 }}>
              <div
                className="relative flex h-full flex-col items-center justify-between overflow-hidden text-center"
                style={{ padding: "3cqw 6cqw 2.2cqw", gap: "1.2cqw", boxShadow: `inset 0 0 0 0.6cqw transparent, inset 0 0 0 calc(0.6cqw + 1px) #b8902f55` }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 grid select-none place-items-center font-bold"
                  style={{ fontFamily: SERIF, fontSize: "22cqw", color: GREEN, opacity: 0.025, letterSpacing: "0.08em" }}
                >
                  REBYU
                </span>
                <FrameCorner className="left-[1cqw] top-[1cqw]" />
                <FrameCorner className="right-[1cqw] top-[1cqw] rotate-90" />
                <FrameCorner className="bottom-[1cqw] right-[1cqw] rotate-180" />
                <FrameCorner className="bottom-[1cqw] left-[1cqw] -rotate-90" />

                <header className="flex flex-col items-center">
                  <p className="font-bold uppercase" style={{ fontSize: sz(1.05, 9), letterSpacing: "0.45em", color: GREEN }}>
                    REBYU Learning
                  </p>
                  <div className="flex items-center justify-center" style={{ gap: "0.8cqw", margin: "0.9cqw 0 1.1cqw" }}>
                    <span style={{ height: 1, width: "6cqw", background: GREEN, opacity: 0.4 }} />
                    <span style={{ width: 7, height: 7, transform: "rotate(45deg)", background: "#b8902f" }} />
                    <span style={{ height: 1, width: "6cqw", background: GREEN, opacity: 0.4 }} />
                  </div>
                  <h1 style={{ fontFamily: SERIF, fontSize: sz(4.4, 28), color: GREEN, lineHeight: 1.05, fontWeight: 700, letterSpacing: "0.01em" }}>
                    Certificate of Completion
                  </h1>
                  <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(1.35, 12), color: "#6b7280", marginTop: "0.8cqw" }}>
                    This certifies that
                  </p>
                </header>

                <section className="flex w-full flex-col items-center">
                  {awardLoading ? (
                    <div className="h-10 w-64 animate-pulse rounded bg-muted/40" />
                  ) : (
                    <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(3.9, 26), color: "#111827", lineHeight: 1.15 }}>
                      {learnerName}
                    </p>
                  )}
                  <div style={{ height: 2, width: "44%", background: "linear-gradient(90deg, transparent, #b8902f, transparent)", margin: "0.6cqw 0 1cqw" }} />
                  <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(1.35, 12), color: "#6b7280" }}>
                    completed the review for
                  </p>
                  {awardLoading ? (
                    <div className="mt-2 h-7 w-72 animate-pulse rounded bg-muted/40" />
                  ) : (
                    <p className="font-bold uppercase" style={{ fontFamily: SERIF, fontSize: sz(2.2, 16), color: "#111827", letterSpacing: "0.06em", marginTop: "0.5cqw" }}>
                      {certTitle}
                    </p>
                  )}
                  <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(1.2, 11), color: "#6b7280", marginTop: "0.4cqw" }}>
                    on the REBYU Learning Platform.
                  </p>
                </section>



                <footer className="certificate-signatures grid w-full grid-cols-[1fr_auto_1fr] items-end" style={{ gap: "4cqw" }}>
                  <div>
                    <p style={{ fontFamily: SERIF, fontSize: sz(1.4, 12), color: "#111827" }}>{fmtDate(certDate)}</p>
                    <div style={{ height: 1, background: "#374151", opacity: 0.5, margin: "0.5cqw 0" }} />
                    <p className="font-bold uppercase" style={{ fontSize: sz(0.8, 8), letterSpacing: "0.16em", color: "#6b7280" }}>{credentialDateLabel}</p>
                  </div>
                  <div style={{ width: sz(11.5, 84), height: sz(11.5, 84) }}>
                    {awardLoading ? (
                      <div className="size-full animate-pulse rounded-full bg-muted/30" />
                    ) : (
                      <CertStamp certificationId={certificationId} award={award} />
                    )}
                  </div>
                  <div>
                    <p className="tabular-nums" style={{ fontFamily: SERIF, fontSize: sz(1.4, 12), color: "#111827" }}>{award?.certificateNumber ?? "—"}</p>
                    <div style={{ height: 1, background: "#374151", opacity: 0.5, margin: "0.5cqw 0" }} />
                    <p className="font-bold uppercase" style={{ fontSize: sz(0.8, 8), letterSpacing: "0.16em", color: "#6b7280" }}>Certificate No.</p>
                  </div>
                </footer>

                <p className="italic" style={{ fontFamily: SERIF, fontSize: sz(0.95, 10), color: "#9ca3af" }}>
                  Issued by the REBYU Learning Platform for completing the certification review above.
                </p>
              </div>
            </div>
          </article>
            </div>
          </section>

          <section className="credential-performance" aria-labelledby="summary-heading">
            <div className="mb-3 flex items-center gap-2.5 border-b border-[var(--tg-line)] pb-3">
              <span className="tg-badge-icon !size-8 !rounded-lg"><TrendingUp className="size-4" aria-hidden="true" /></span>
              <h2 id="summary-heading" className="text-lg font-bold text-foreground">Performance summary</h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-muted-foreground">These are your current learning results. Later assessments may change them; the credential issue date remains the same.</p>
            <dl className="credential-stats">
              {stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{isLoading ? "…" : stat.value}</dd><p>{stat.note}</p></div>)}
            </dl>
        <div>
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
        <div className="space-y-5">
        <MockExamAnalytics scoreTrend={d.scoreTrend} />
        <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">

          <div className="space-y-5">

            <div className="tg-frame p-5">
              <SectionHead icon={Layers3}>Module Mastery</SectionHead>
              <CategoryChart rows={d.categoryMastery} theme={theme} />
            </div>

            <div className="tg-frame p-5">
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
                  <div className="mt-1 rounded-xl border border-[var(--tg-line)] bg-[var(--tg-softer)] px-4 py-3">
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

          <div className="space-y-5">

            <div className="tg-frame p-5">
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
                          <p className="break-words text-sm font-semibold text-foreground">{t.lessonTitle}</p>
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

            <div className="tg-frame p-5">
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
        </div>
      )}
        </div>
          </section>
        </div>
      </div>
    </div>
  )
}
