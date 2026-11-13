import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CreditCard, Download, GraduationCapIcon, UserCheck } from "@/components/icons"

import {
  InstitutionErrorState,
  InstitutionLoadingSkeleton,
  InstitutionPageHeader,
  InstitutionStatusBadge,
  formatDateTime,
} from "@/components/institution/institution-ui.jsx"
import { BentoHeading, BentoStat, BentoTile } from "@/components/commons/bento.jsx"
import {
  BarBreakdownChart,
  DonutChart,
  TrendAreaChart,
  TrendLineChart,
  Sparkline,
} from "@/components/charts/rebyu-charts.jsx"
import { Link } from "react-router-dom"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { ADMIN_DEFAULT } from "@/components/commons/dashboard-tile-labels.js"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/commons/export-button.jsx"
import { getPlatformMetrics, getUserPresence } from "@/services/adminMetricsService.js"
import { base } from "@/services/base"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

function money(value) {
  if (value == null) return "—"
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value))
}

const RETIRED_TILES = new Set(["admin-users", "admin-sales", "admin-pass-rate", "admin-partners"])

const PERIODS = [
  { key: "week", label: "Week", hint: "Each day, last 7 days" },
  { key: "month", label: "Month", hint: "Each day, last 30 days" },
  { key: "year", label: "Year", hint: "Each month, last 12 months" },
]

function localDate(iso) {
  const [year, month, day] = String(iso).split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function bucketLabel(iso, period) {
  const date = localDate(iso)
  if (period === "year") return date.toLocaleDateString(undefined, { month: "short" })
  if (period === "week") return date.toLocaleDateString(undefined, { weekday: "short" })
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function PeriodSwitch({ value, onChange }) {
  return (
    <div role="group" aria-label="Time range" className="inline-flex gap-1 rounded-rb-control border-2 border-border p-1">
      {PERIODS.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
          className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            value === option.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function MiniRows({ rows }) {
  return (
    <dl className="mt-2 space-y-1 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-2 border-b border-black/5 pb-1 last:border-0">
          <dt className="truncate font-semibold opacity-75">{label}</dt>
          <dd className="font-extrabold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function MiniBars({ rows }) {
  const peak = Math.max(1, ...rows.map(([, value]) => value))
  return (
    <ul className="space-y-2 text-xs">
      {rows.map(([label, value]) => (
        <li key={label}>
          <div className="flex justify-between gap-2 font-semibold">
            <span className="truncate opacity-80">{label}</span>
            <span className="font-extrabold tabular-nums">{value}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-black/10">
            <div className="h-full rounded-full bg-rb-eel" style={{ width: `${(value / peak) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboard() {
  const metricsQuery = useQuery({
    queryKey: ["admin-platform-metrics"],
    queryFn: getPlatformMetrics,
    retry: 1,
  })

  const [period, setPeriod] = useState("week")
  const presenceQuery = useQuery({
    queryKey: ["admin-presence", period],
    queryFn: () => getUserPresence(period),
    refetchInterval: 30_000,
    placeholderData: (previous) => previous,
    retry: 1,
  })

  const partnershipsQuery = useQuery({
    queryKey: ["partnership-requests"],
    queryFn: () => base("partnership-requests"),
    retry: 1,
  })
  const layout = useDashboardLayout("admin")

  const metrics = metricsQuery.data ?? {}
  const people = metrics.people ?? {}
  const catalog = metrics.catalog ?? {}
  const sales = metrics.sales ?? {}
  const assessments = metrics.assessments ?? {}
  const planMix = metrics.planMix ?? null
  const pro = metrics.pro ?? null
  const presence = presenceQuery.data ?? null

  const activity = useMemo(
    () =>
      asArray(presence?.history).map((point) => ({
        bucket: point.bucket,
        label: bucketLabel(point.bucket, presence?.period ?? period),
        active: Number(point.activeUsers ?? 0),
        total: Number(point.totalUsers ?? 0),
      })),
    [presence, period]
  )
  const activityPeak = Math.max(4, ...activity.map((row) => Math.max(row.active, row.total)))

  const trends = useMemo(
    () =>
      asArray(metrics.trends).map((row) => {
        const [year, month] = String(row.month).split("-").map(Number)
        const label = new Date(year, (month || 1) - 1, 1).toLocaleDateString(undefined, { month: "short" })
        return {
          month: label,
          monthKey: String(row.month).slice(0, 7),
          users: Number(row.newUsers ?? 0),
          attempts: Number(row.attempts ?? 0),
          sales: Math.round(Number(row.certificationSales ?? 0)),
          pro: Math.round(Number(row.proRevenue ?? 0)),
          approvals: Number(row.proApprovals ?? 0),
        }
      }),
    [metrics.trends]
  )
  const revenuePeak = Math.max(10, ...trends.map((row) => Math.max(row.sales, row.pro)))

  const planSlices = useMemo(
    () =>
      planMix
        ? [
            { name: "Free", value: Number(planMix.freeLearners ?? 0) },
            { name: "Pro", value: Number(planMix.proLearners ?? 0) },
            { name: "Awaiting approval", value: Number(planMix.awaitingApproval ?? 0) },
          ].filter((slice) => slice.value > 0)
        : [],
    [planMix]
  )

  const recentPayments = useMemo(() => {
    const orders = asArray(metrics.recentPayments)
      .filter((order) => Number(order.amount ?? 0) > 0)
      .map((order) => ({
        key: `order-${order.orderId}`,
        name: order.learnerName,
        kind: "Certification",
        reference: order.orderNumber ?? `Order #${order.orderId}`,
        amount: order.amount,
        paidAt: order.paidAt,
        status: "Paid",
      }))
    const proPayments = asArray(pro?.recentPayments).map((payment) => ({
      key: `pro-${payment.subscriptionId}`,
      name: payment.learnerName ?? payment.email,
      kind: "Pro",
      reference: payment.invoiceNumber,
      amount: payment.amount,
      paidAt: payment.paidAt,
      status: payment.status,
    }))
    return [...orders, ...proPayments]
      .sort((a, b) => new Date(b.paidAt ?? 0) - new Date(a.paidAt ?? 0))
      .slice(0, 8)
  }, [metrics.recentPayments, pro])

  const learnersPerCertification = useMemo(
    () => asArray(metrics.learnersPerCertification),
    [metrics.learnersPerCertification]
  )

  const catalogMix = useMemo(() => {
    const published = Number(catalog.publishedCertifications ?? 0)
    const draft = Math.max(Number(catalog.certifications ?? 0) - published, 0)
    return [
      { name: "Published", value: published },
      { name: "Draft", value: draft },
    ].filter((slice) => slice.value > 0)
  }, [catalog.certifications, catalog.publishedCertifications])

  const recentPartnerships = useMemo(
    () =>
      [...asArray(partnershipsQuery.data)]
        .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0))
        .slice(0, 5),
    [partnershipsQuery.data]
  )

  const buildSections = () => {
    const range = PERIODS.find((option) => option.key === (presence?.period ?? period))
    return [
      {
        title: "Current platform presence (administrators excluded)",
        columns: ["Metric", "Value"],
        rows: [
          [`Online now (used REBYU in the last ${presence?.onlineWindowMinutes ?? 5} minutes)`, presence?.onlineUsers],
          ["Total non-admin users", presence?.totalUsers],
        ],
      },
      {
        title: `User activity (${range?.label ?? "Week"}: ${range?.hint?.toLowerCase() ?? ""})`,
        columns: [range?.key === "year" ? "Month" : "Day", "Active users", "Total users"],
        rows: activity.map((row) => [row.bucket, row.active, row.total]),
      },
      {
        title: "Platform summary",
        columns: ["Measure", "Value", "Definition"],
        rows: [
          ["Learners", people.learners, "Learner accounts"],
          ["Learners enrolled", people.learnersInCertification, "Distinct learners with at least one active certification enrollment"],
          ["Active certification enrollments", people.activeEnrollments, "Each learner-certification relationship counts separately"],
          ["Certifications", catalog.certifications, "All certifications in the catalog"],
          ["Published certifications", catalog.publishedCertifications, "Catalog certifications currently published"],
          ["Institutions onboarded", catalog.institutions, "Institution accounts on the platform"],
          ["Partnership requests awaiting review", catalog.pendingPartnerships, "Requests in pending or under-review status"],
          ["Completed certification orders", sales.paidOrders, "Completed learner certification orders, including free (₱0) ones"],
          ["Pending certification orders", sales.pendingOrders, "Learner orders awaiting payment or completion"],
          ["Live subscriptions", sales.activeSubscriptions, "Subscriptions in an active or trial state"],
          ["Live institution licences", sales.activeLicenses, "Institution licences in an active or trial state"],
          ["Graded attempts", assessments.gradedAttempts, "Submitted attempts on certification assessments (not AI practice or department papers)"],
          ["Recorded Pro subscription revenue (PHP)", pro?.approvedRevenue, "Subscription payments with an active billing period"],
          ["Recorded Pro revenue, past 30 days (PHP)", pro?.approvedRevenueLast30Days, "Subscription payments whose billing period began in the past 30 days"],
          ["Learners on Pro", pro?.activePro, "Distinct learners with an active or trial Pro subscription"],
          ["Pro payments awaiting approval", pro?.awaitingApproval, "Paid Pro subscriptions still awaiting review"],
          ["Pro revenue awaiting approval (PHP)", pro?.awaitingRevenue, "Value of paid Pro subscriptions still awaiting review"],
        ],
      },
      {
        title: "Certification enrollment",
        columns: ["Certification", "Distinct learners", "Active enrollments"],
        rows: learnersPerCertification.map((row) => [row.title, row.learners, row.enrollments]),
      },
      {
        title: "Learner plans",
        columns: ["Plan", "Learners"],
        rows: planSlices.map((slice) => [slice.name, slice.value]),
      },
      {
        title: "Revenue and activity (last six months)",
        columns: [
          "Month",
          "Certification sales (PHP)",
          "Recorded Pro subscription payments (PHP)",
          "Pro billing periods started",
          "New accounts",
          "Assessment attempts",
        ],
        rows: trends.map((row) => [row.monthKey, row.sales, row.pro, row.approvals, row.users, row.attempts]),
      },
      {
        title: "Certification catalog",
        columns: ["Status", "Certifications"],
        rows: catalogMix.map((slice) => [slice.name, slice.value]),
      },
      {
        title: "Recent certification orders and Pro subscription payments (any status)",
        columns: ["Learner", "Type", "Reference", "Amount (PHP)", "Paid at", "Status"],
        rows: recentPayments.map((payment) => [
          payment.name,
          payment.kind,
          payment.reference,
          payment.amount,
          payment.paidAt,
          payment.status,
        ]),
      },
      {
        title: "Recent partnership requests",
        columns: ["Request", "Status", "Submitted at"],
        rows: recentPartnerships.map((request) => [
          `Request #${request.requestId}`,
          request.status,
          request.submittedAt,
        ]),
      },
    ]
  }

  const tiles = useMemo(() => {
    const failed = metricsQuery.isError
    const range = PERIODS.find((option) => option.key === period)

    return [
      {
        id: "admin-user-activity",
        x: 0,
        y: 0,
        col: 4,
        row: 3,
        element: (
          <BentoTile col={4} row={3}>
            <BentoHeading
              title="Active users"
              hint={`${range.hint}: people who used REBYU, against total users. Admins are not counted.`}
              action={<PeriodSwitch value={period} onChange={setPeriod} />}
            />
            {presenceQuery.isError ? (
              <p className="mt-4 text-sm text-muted-foreground">Could not be loaded.</p>
            ) : (
              <TrendLineChart
                data={activity}
                xKey="label"
                height={340}
                dot={period !== "month"}
                domain={[0, Math.ceil(activityPeak * 1.15)]}
                series={[
                  { key: "active", name: "Active users" },
                  { key: "total", name: "Total users" },
                ]}
                legendNote={period === "year" ? "This month" : "Today"}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-online",
        x: 4,
        y: 0,
        col: 2,
        row: 1,
        element: (
          <BentoStat
            tone="leaf"
            col={2}
            row={1}
            icon={UserCheck}
            label="Online now"
            value={presenceQuery.isError ? "—" : count(presence?.onlineUsers)}
            children={
              presenceQuery.isError || activity.length === 0 ? null : (
                <div>
                  <Sparkline data={activity} dataKey="active" height={52} />
                  <MiniRows
                    rows={[
                      [range.key === "year" ? "Active this month" : "Active today", activity.at(-1)?.active ?? 0],
                      [`Peak, ${range.label.toLowerCase()}`, Math.max(...activity.map((row) => row.active))],
                    ]}
                  />
                </div>
              )
            }
            hint={
              presenceQuery.isError
                ? "Could not be loaded"
                : `of ${count(presence?.totalUsers)} total users · last ${presence?.onlineWindowMinutes ?? 5} min`
            }
          />
        ),
      },
      {
        id: "admin-studying",
        x: 4,
        y: 1,
        col: 2,
        row: 1,
        element: (
          <BentoStat
            tone="feather"
            col={2}
            row={1}
            icon={GraduationCapIcon}
            label="Learners enrolled"
            value={failed ? "—" : count(people.learnersInCertification)}
            children={
              failed || learnersPerCertification.length === 0 ? null : (
                <MiniBars
                  rows={learnersPerCertification.slice(0, 4).map((row) => [row.title, Number(row.learners ?? 0)])}
                />
              )
            }
            hint={failed ? "Could not be loaded" : `${count(people.activeEnrollments)} active certification enrollments`}
          />
        ),
      },
      {
        id: "admin-pro-revenue",
        x: 4,
        y: 2,
        col: 2,
        row: 1,
        element: (
          <BentoStat
            tone="bee"
            col={2}
            row={1}
            icon={CreditCard}
            label="Recorded Pro revenue"
            value={failed || !pro ? "—" : money(pro.approvedRevenue)}
            children={
              failed || !pro || trends.length === 0 ? null : (
                <div>
                  <Sparkline data={trends} dataKey="pro" height={52} />
                  <MiniRows
                    rows={[
                      ["This month", money(trends.at(-1)?.pro ?? 0)],
                    ]}
                  />
                </div>
              )
            }
            hint={
              failed || !pro
                ? "Could not be loaded"
                : `${money(pro.approvedRevenueLast30Days)} in 30 days · ${count(pro.activePro)} learners on Pro`
            }
          />
        ),
      },
      {
        id: "admin-learners-per-cert",
        x: 0,
        y: 3,
        col: 4,
        row: 2,
        element: (
          <BentoTile col={4} row={2}>
            <BentoHeading
              title="Learners per certification"
              hint="Distinct people with an active enrollment in each certification"
            />
            {failed ? (
              <p className="mt-4 text-sm text-muted-foreground">Could not be loaded.</p>
            ) : learnersPerCertification.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No active enrollments yet.</p>
            ) : (
              <BarBreakdownChart
                data={learnersPerCertification.map((row) => ({
                  certification: row.title,
                  learners: Number(row.learners ?? 0),
                }))}
                categoryKey="certification"
                valueKey="learners"
                height={200}
                categoryWidth={132}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-plan-mix",
        x: 4,
        y: 3,
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2}>
            <BentoHeading
              title="Learner plans"
              hint={
                <>
                  Free against Pro.{" "}
                  {Number(planMix?.awaitingApproval ?? 0) > 0 ? (
                    <Link to="/admin/subscriptions" className="font-bold text-rb-feather-lip underline">
                      {planMix.awaitingApproval} waiting for approval
                    </Link>
                  ) : null}
                </>
              }
            />
            {failed || planSlices.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {failed ? "Could not be loaded." : "No learners yet."}
              </p>
            ) : (
              <DonutChart
                data={planSlices}
                height={160}
                centerValue={String(Number(planMix?.proLearners ?? 0))}
                centerLabel="on Pro"
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-revenue",
        x: 0,
        y: 5,
        col: 4,
        row: 2,
        element: (
          <BentoTile col={4} row={2}>
            <BentoHeading
              title="Revenue"
              hint="Completed certification sales and recorded Pro subscription payments, in pesos"
            />
            {failed ? (
              <p className="mt-4 text-sm text-muted-foreground">Could not be loaded.</p>
            ) : (
              <TrendLineChart
                data={trends}
                xKey="month"
                height={190}
                domain={[0, Math.ceil(revenuePeak * 1.15)]}
                series={[
                  { key: "sales", name: "Certification sales" },
                  { key: "pro", name: "Pro subscriptions" },
                ]}
                legendNote="This month, ₱"
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-catalog",
        x: 4,
        y: 5,
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2}>
            <BentoHeading title="Certification catalog" hint="Published against still in draft" />
            {failed || catalogMix.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {failed ? "Could not be loaded." : "No certifications yet."}
              </p>
            ) : (
              <DonutChart
                data={catalogMix}
                height={168}
                centerValue={String(catalog.certifications ?? 0)}
                centerLabel={catalog.certifications === 1 ? "cert" : "certs"}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-growth",
        x: 0,
        y: 7,
        col: 4,
        row: 2,
        element: (
          <BentoTile col={4} row={2}>
            <BentoHeading
              title="Platform activity"
              hint="New accounts and graded certification assessment attempts, last six months"
            />
            {failed ? (
              <p className="mt-4 text-sm text-muted-foreground">Could not be loaded.</p>
            ) : (
              <TrendAreaChart
                data={trends}
                xKey="month"
                stacked={false}
                height={190}
                series={[
                  { key: "attempts", name: "Assessment attempts" },
                  { key: "users", name: "New accounts" },
                ]}
                legendNote="This month"
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-commercial",
        x: 4,
        y: 7,
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2}>
            <BentoHeading title="Billing" hint="Orders, subscriptions, and institutional licences" />
            {failed ? (
              <p className="mt-4 text-sm text-muted-foreground">Could not be loaded.</p>
            ) : (
              <BarBreakdownChart
                data={[
                  { label: "Completed orders", count: Number(sales.paidOrders ?? 0) },
                  { label: "Pending orders", count: Number(sales.pendingOrders ?? 0) },
                  { label: "Pro subs", count: Number(sales.activeSubscriptions ?? 0) },
                  { label: "Pro pending", count: Number(planMix?.awaitingApproval ?? 0) },
                  { label: "Licences", count: Number(sales.activeLicenses ?? 0) },
                ]}
                categoryKey="label"
                valueKey="count"
                height={168}
                categoryWidth={104}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-recent-payments",
        x: 0,
        y: 9,
        col: 4,
        row: 2,
        element: (
          <BentoTile col={4} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <BentoHeading
                title="Recent payments"
                hint="Latest completed certification orders and paid Pro subscriptions."
                action={
                  <Link to="/admin/payments" className="text-xs font-bold text-rb-feather-lip underline">
                    {pro?.awaitingApproval ? `Review ${pro.awaitingApproval} waiting` : "View all"}
                  </Link>
                }
              />

              {failed ? (
                <p className="text-sm text-muted-foreground">Payments could not be loaded.</p>
              ) : recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No paid purchases or Pro subscriptions yet.</p>
              ) : (
                <ul className="-mr-2 grid min-h-0 flex-1 grid-cols-1 content-start gap-x-6 overflow-y-auto pr-2 lg:grid-cols-2">
                  {recentPayments.map((payment) => (
                    <li
                      key={payment.key}
                      className="flex items-center justify-between gap-2 border-b-2 border-border py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-bold">
                          <span className="truncate">{payment.name}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              payment.kind === "Pro" ? "bg-rb-feather-wash text-rb-feather-lip" : "bg-rb-macaw-wash text-rb-macaw-lip"
                            }`}
                          >
                            {payment.kind}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {payment.reference} · {formatDateTime(payment.paidAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold tabular-nums text-primary">{money(payment.amount)}</p>
                        <p
                          className={`text-[11px] font-bold ${
                            payment.status === "Awaiting approval"
                              ? "text-rb-bee-lip"
                              : payment.status === "Active" || payment.status === "Paid"
                                ? "text-rb-feather-lip"
                                : "text-muted-foreground"
                          }`}
                        >
                          {payment.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BentoTile>
        ),
      },
      {
        id: "admin-recent-partnerships",
        x: 4,
        y: 9,
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <BentoHeading
                title="Institutions"
                hint={
                  failed
                    ? "Latest partnership requests."
                    : `${count(catalog.institutions)} onboarded · ${count(catalog.pendingPartnerships)} awaiting review`
                }
              />

              {partnershipsQuery.isError ? (
                <p className="text-sm text-muted-foreground">Partnership requests could not be loaded.</p>
              ) : recentPartnerships.length === 0 ? (
                <p className="text-sm text-muted-foreground">No partnership requests yet.</p>
              ) : (
                <ul className="-mr-2 min-h-0 flex-1 divide-y-2 divide-border overflow-y-auto pr-2">
                  {recentPartnerships.map((request) => (
                    <li
                      key={request.requestId}
                      className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">Request #{request.requestId}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(request.submittedAt)}</p>
                      </div>
                      <InstitutionStatusBadge status={request.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BentoTile>
        ),
      },
    ]
  }, [
    metricsQuery.isError,
    presenceQuery.isError,
    presence,
    period,
    activity,
    activityPeak,
    trends,
    revenuePeak,
    planSlices,
    planMix,
    pro,
    people,
    catalog,
    sales,
    recentPayments,
    recentPartnerships,
    learnersPerCertification,
    catalogMix,
    partnershipsQuery.isError,
  ])

  if (metricsQuery.isLoading) return <InstitutionLoadingSkeleton />

  if (metricsQuery.isError && partnershipsQuery.isError && presenceQuery.isError) {
    return (
      <div className="space-y-6">
        <InstitutionPageHeader
          title="Dashboard"
          subtitle="Platform overview across learners, institutions, and certifications."
        />
        <InstitutionErrorState
          title="Unable to load platform data"
          description="The dashboard could not reach the REBYU backend. Check that the API is running."
          onRetry={() => {
            metricsQuery.refetch()
            presenceQuery.refetch()
            partnershipsQuery.refetch()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <InstitutionPageHeader
        title="Dashboard"
        subtitle="Platform overview across learners, institutions, and certifications. Admins are not counted as users."
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <ExportButton
          filename="rebyu-admin-dashboard"
          report="Platform dashboard"
          details={[["Scope", "Whole platform; administrators are not counted"]]}
          sections={buildSections}
          disabled={metricsQuery.isLoading || metricsQuery.isError || presenceQuery.isLoading}
          size="default"
        />

        <DashboardRearrangeControls
          rearranging={layout.rearranging}
          onStart={layout.startRearranging}
          onFinish={layout.finishRearranging}
          onCancel={layout.cancelRearranging}
          onReset={layout.resetLayout}
        />
      </div>

      <DashboardBoard
        tiles={tiles}
        layout={
          layout.tileLayout.some((item) => RETIRED_TILES.has(item.id)) ? [] : layout.tileLayout
        }
        defaultOrder={ADMIN_DEFAULT.order}
        defaultCols={ADMIN_DEFAULT.cols}
        editing={layout.rearranging}
        onLayoutChange={layout.handleLayoutChange}
      />
    </div>
  )
}
