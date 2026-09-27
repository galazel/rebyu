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
} from "@/components/charts/rebyu-charts.jsx"
import { Link } from "react-router-dom"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import { Button } from "@/components/ui/button"
import { downloadCsv, timestampedFilename, toCsv } from "@/lib/csv.js"
import { getPlatformMetrics, getUserPresence } from "@/services/adminMetricsService.js"
import { base } from "@/services/base"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

/**
 * A number the server could not source is a dash, never a zero.
 *
 * "Nothing has happened yet" and "we could not work it out" are different facts
 * about the platform, and an admin acting on the second while reading the first
 * is exactly the kind of mistake a dashboard should not invite.
 */
function count(value) {
  return value == null ? "—" : Number(value).toLocaleString()
}

/** Peso figures, because that is what LearnerOrder.totalAmount is denominated in. */
function money(value) {
  if (value == null) return "—"
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value))
}

/* Tiles the 2026-09 redesign removed. A saved arrangement that still names
   one was made for the old board, and replaying it would scatter the new
   tiles around the old gaps -- so it gives way to the new default until the
   admin arranges the board again. */
const RETIRED_TILES = new Set(["admin-users", "admin-sales", "admin-pass-rate", "admin-partners"])

const PERIODS = [
  { key: "week", label: "Week", hint: "Each day, last 7 days" },
  { key: "month", label: "Month", hint: "Each day, last 30 days" },
  { key: "year", label: "Year", hint: "Each month, last 12 months" },
]

/** "2026-09-26" as a local date -- `new Date(string)` would read it as UTC midnight and slip a day west of Greenwich. */
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

/** Week / Month / Year switch for the user activity graph. */
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

export default function AdminDashboard() {
  /* One aggregate call for every counter. The page used to fetch six global
     lists in full and count them in the browser; these are COUNT/SUM queries
     that stay the same size as the platform grows. */
  const metricsQuery = useQuery({
    queryKey: ["admin-platform-metrics"],
    queryFn: getPlatformMetrics,
    retry: 1,
  })

  /* Who is online, and active users over the chosen range. Polled, because
     "right now" is the whole point of the number; the old range stays on
     screen while a new one loads so the graph does not blink out. */
  const [period, setPeriod] = useState("week")
  const presenceQuery = useQuery({
    queryKey: ["admin-presence", period],
    queryFn: () => getUserPresence(period),
    refetchInterval: 30_000,
    placeholderData: (previous) => previous,
    retry: 1,
  })

  /* The partnership feed needs rows rather than counts, so it stays a list read. */
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

  /* Six calendar months, oldest first, labelled "Apr", "May"... The server
     zero-fills quiet months so a line never jumps a gap. */
  const trends = useMemo(
    () =>
      asArray(metrics.trends).map((row) => {
        const [year, month] = String(row.month).split("-").map(Number)
        const label = new Date(year, (month || 1) - 1, 1).toLocaleDateString(undefined, { month: "short" })
        return {
          month: label,
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

  /* Everyone who actually paid, whichever way: certification orders and Pro
     subscriptions in one feed, newest first. A ₱0 order (a free certification)
     is an enrollment, not a payment, so it is left out. */
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

  /* Donut slices are dropped when zero rather than drawn as an invisible wedge
     with a legend entry -- a legend listing a category that contributes nothing
     reads as a rendering fault. */
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

  /**
   * The screen, as a spreadsheet.
   *
   * Every section is a tile above, in the order the tiles read, so an admin
   * who exports can point at a row and find the chart it came from. Feeds go
   * out at the length they are shown, and the user activity section is the
   * range currently selected on the graph.
   *
   * Numbers go out bare -- no peso sign, no thousands separator -- because a
   * formatted figure lands in a spreadsheet as text and will not sum.
   */
  const buildCsv = () => {
    const range = PERIODS.find((option) => option.key === (presence?.period ?? period))
    return toCsv([
      {
        title: "REBYU platform dashboard",
        columns: ["Exported", new Date().toISOString()],
      },
      {
        title: "Attendance (admins not counted)",
        columns: ["Metric", "Value"],
        rows: [
          [`Online now (used REBYU in the last ${presence?.onlineWindowMinutes ?? 5} minutes)`, presence?.onlineUsers],
          ["Total users", presence?.totalUsers],
        ],
      },
      {
        title: `User activity (${range?.label ?? "Week"}: ${range?.hint?.toLowerCase() ?? ""})`,
        columns: [range?.key === "year" ? "Month" : "Day", "Active users", "Total users"],
        rows: activity.map((row) => [row.bucket, row.active, row.total]),
      },
      {
        title: "Summary",
        columns: ["Metric", "Value"],
        rows: [
          ["Learners", people.learners],
          ["Learners in a certification", people.learnersInCertification],
          ["Active enrollments", people.activeEnrollments],
          ["Certifications", catalog.certifications],
          ["Published certifications", catalog.publishedCertifications],
          ["Institutions onboarded", catalog.institutions],
          ["Partnership requests pending", catalog.pendingPartnerships],
          ["Paid orders", sales.paidOrders],
          ["Pending orders", sales.pendingOrders],
          ["Active subscriptions", sales.activeSubscriptions],
          ["Active licences", sales.activeLicenses],
          ["Graded attempts", assessments.gradedAttempts],
          ["Pro revenue approved (PHP)", pro?.approvedRevenue],
          ["Pro revenue last 30 days (PHP)", pro?.approvedRevenueLast30Days],
          ["Learners on Pro", pro?.activePro],
          ["Pro awaiting approval", pro?.awaitingApproval],
          ["Pro awaiting revenue (PHP)", pro?.awaitingRevenue],
        ],
      },
      {
        title: "Learners per certification",
        columns: ["Certification", "Learners"],
        rows: learnersPerCertification.map((row) => [row.title, row.learners]),
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
          "Pro revenue (PHP)",
          "Pro approvals",
          "New accounts",
          "Assessment attempts",
        ],
        rows: trends.map((row) => [row.month, row.sales, row.pro, row.approvals, row.users, row.attempts]),
      },
      {
        title: "Certification catalog",
        columns: ["Status", "Certifications"],
        rows: catalogMix.map((slice) => [slice.name, slice.value]),
      },
      {
        title: "Learners who paid",
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
    ])
  }

  /* Placed by coordinate in even six-column bands, each a wide chart beside a
     narrow one, so the board reads as rows rather than a scatter:
       y0  user activity (4, 3 tall)  | online now / on a certification / Pro revenue (2, stacked)
       y3  learners per cert (4)      | learner plans (2)
       y5  revenue (4)                | catalog (2)
       y7  platform activity (4)      | billing (2)
       y9  learners who paid (4)      | partnership requests (2) */
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
            label="Taking a certification"
            value={failed ? "—" : count(people.learnersInCertification)}
            // Distinct people, not enrollment rows: one learner can hold several
            // active certifications, and conflating the two overstates the roll.
            hint={failed ? "Could not be loaded" : `${count(people.activeEnrollments)} active enrollments`}
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
            label="Pro revenue (test)"
            value={failed || !pro ? "—" : money(pro.approvedRevenue)}
            hint={
              failed || !pro
                ? "Could not be loaded"
                : `${money(pro.approvedRevenueLast30Days)} in 30 days · ${count(pro.activePro)} on Pro`
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
              hint="Certification sales and approved Pro subscriptions (PayMongo test mode), in pesos"
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
              hint="New accounts and graded assessment attempts, last six months"
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
                  { label: "Paid orders", count: Number(sales.paidOrders ?? 0) },
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
                title="Learners who paid"
                hint="Latest certification purchases and Pro subscriptions (PayMongo test mode)."
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
                /* A wide tile would strand a single column of rows in white
                   space, so the feed splits into two tracks once there is room. */
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
        {/* Disabled until the numbers are actually in hand: a CSV exported
            mid-load would be a file full of blanks that reads like a platform
            with nothing on it. */}
        <Button
          variant="outline"
          onClick={() => downloadCsv(timestampedFilename("rebyu-admin-dashboard"), buildCsv())}
          disabled={metricsQuery.isLoading || metricsQuery.isError || presenceQuery.isLoading}
        >
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>

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
        editing={layout.rearranging}
        onLayoutChange={layout.handleLayoutChange}
      />
    </div>
  )
}
