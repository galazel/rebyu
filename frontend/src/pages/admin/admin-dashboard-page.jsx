import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  DollarSign,
  GraduationCapIcon,
  UsersIcon,
} from "@/components/icons"

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
  RadialGauge,
  TrendAreaChart,
  TrendLineChart,
} from "@/components/charts/rebyu-charts.jsx"
import { Link } from "react-router-dom"
import { DashboardBoard } from "@/components/commons/dashboard-board.jsx"
import { DashboardRearrangeControls } from "@/components/commons/dashboard-rearrange-controls.jsx"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.js"
import { getPlatformMetrics } from "@/services/adminMetricsService.js"
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

export default function AdminDashboard() {
  /* One aggregate call for every counter. The page used to fetch six global
     lists in full and count them in the browser; these are COUNT/SUM queries
     that stay the same size as the platform grows. */
  const metricsQuery = useQuery({
    queryKey: ["admin-platform-metrics"],
    queryFn: getPlatformMetrics,
    retry: 1,
  })

  /* The partnership feed needs rows rather than counts, so it stays a list read.
     It is the only one left: payments now come down with the metrics payload,
     and the /exam-results fetch went with the assessment feed it fed. */
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

  /* Six calendar months, oldest first, labelled "Apr", "May"... The server
     zero-fills quiet months so a line never jumps a gap. */
  const trends = useMemo(
    () =>
      asArray(metrics.trends).map((row) => {
        const [year, month] = String(row.month).split("-").map(Number)
        const label = new Date(year, (month || 1) - 1, 1).toLocaleDateString(undefined, { month: "short" })
        const attempts = Number(row.attempts ?? 0)
        return {
          month: label,
          users: Number(row.newUsers ?? 0),
          attempts,
          passRate: attempts ? Math.round((Number(row.passedAttempts ?? 0) * 100) / attempts) : 0,
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

  const recentPayments = useMemo(
    () => asArray(metrics.recentPayments),
    [metrics.recentPayments]
  )

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

  const feeds = useMemo(() => {
    const partnerships = asArray(partnershipsQuery.data)
    return {
      recentPartnerships: [...partnerships]
        .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0))
        .slice(0, 5),
    }
  }, [partnershipsQuery.data])

  const tiles = useMemo(() => {
    const failed = metricsQuery.isError

    return [
      {
        id: "admin-growth",
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
        id: "admin-plan-mix",
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
        id: "admin-pass-rate",
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2}>
            <BentoHeading
              title="Pass rate"
              hint={`${count(assessments.gradedAttempts)} graded attempts · average score ${
                assessments.averageScore == null ? "—" : `${assessments.averageScore}%`
              }`}
            />
            {failed || assessments.passRate == null ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {failed ? "Could not be loaded." : "Nothing graded yet."}
              </p>
            ) : (
              <RadialGauge value={assessments.passRate} label="passed" height={170} />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-users",
        col: 2,
        row: 2,
        element: (
          <BentoStat
            tone="macaw"
            col={2}
            row={2}
            icon={UsersIcon}
            label="Total users"
            value={failed ? "—" : count(people.totalUsers)}
            hint={
              failed
                ? "Could not be loaded"
                : `${count(people.activeUsers)} active · ${count(people.learners)} learners`
            }
          />
        ),
      },
      {
        id: "admin-studying",
        col: 2,
        row: 2,
        element: (
          <BentoStat
            tone="feather"
            col={2}
            row={2}
            icon={GraduationCapIcon}
            label="Currently taking a certification"
            value={failed ? "—" : count(people.learnersInCertification)}
            // Distinct people, not enrollment rows: one learner can hold several
            // active certifications, and conflating the two overstates the roll.
            hint={
              failed
                ? "Could not be loaded"
                : `${count(people.activeEnrollments)} active enrollments`
            }
          />
        ),
      },
      {
        id: "admin-sales",
        col: 2,
        row: 2,
        element: (
          <BentoStat
            tone="bee"
            col={2}
            row={2}
            icon={DollarSign}
            label="Gross sales"
            value={failed ? "—" : money(sales.grossSales)}
            hint={
              failed
                ? "Could not be loaded"
                : `${money(sales.salesLast30Days)} in the last 30 days`
            }
          />
        ),
      },
      {
        id: "admin-learners-per-cert",
        col: 4,
        row: 2,
        element: (
          <BentoTile col={4} row={2}>
            <BentoHeading
              title="Learners per certification"
              hint="Distinct people with an active enrollment in each certification"
            />
            {failed ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Could not be loaded.
              </p>
            ) : learnersPerCertification.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No active enrollments yet.
              </p>
            ) : (
              <BarBreakdownChart
                data={learnersPerCertification.map((row) => ({
                  certification: row.title,
                  learners: Number(row.learners ?? 0),
                }))}
                categoryKey="certification"
                valueKey="learners"
                height={180}
                categoryWidth={132}
              />
            )}
          </BentoTile>
        ),
      },
      {
        id: "admin-catalog",
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2}>
            <BentoHeading
              title="Certification catalog"
              hint="Published against still in draft"
            />
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
        id: "admin-commercial",
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2}>
            <BentoHeading
              title="Billing"
              hint="Orders, subscriptions, and institutional licences"
            />
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
        id: "admin-partners",
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2}>
            <BentoHeading
              title="Organizations"
              hint="Onboarded against requests still awaiting review"
            />
            {failed ? (
              <p className="mt-4 text-sm text-muted-foreground">Could not be loaded.</p>
            ) : (
              <BarBreakdownChart
                data={[
                  { label: "Onboarded", count: Number(catalog.organizations ?? 0) },
                  { label: "Pending", count: Number(catalog.pendingPartnerships ?? 0) },
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
        id: "admin-recent-partnerships",
        col: 2,
        row: 2,
        element: (
          <BentoTile col={2} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <BentoHeading
                title="Recent partnership requests"
                hint="Latest requests from organizations."
              />

              {partnershipsQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Partnership requests could not be loaded.
                </p>
              ) : feeds.recentPartnerships.length === 0 ? (
                <p className="text-sm text-muted-foreground">No partnership requests yet.</p>
              ) : (
                <ul className="-mr-2 min-h-0 flex-1 divide-y-2 divide-border overflow-y-auto pr-2">
                  {feeds.recentPartnerships.map((request) => (
                    <li
                      key={request.requestId}
                      className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">Request #{request.requestId}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(request.submittedAt)}
                        </p>
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
      {
        id: "admin-recent-payments",
        col: 4,
        row: 2,
        element: (
          <BentoTile col={4} row={2} className="!p-0">
            <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <BentoHeading
                title="Learners who paid"
                hint="Latest completed orders."
              />

              {metricsQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  Payments could not be loaded.
                </p>
              ) : recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                /* A wide tile would strand a single column of rows in white
                   space, so the feed splits into two tracks once there is room. */
                <ul className="-mr-2 grid min-h-0 flex-1 grid-cols-1 content-start gap-x-6 overflow-y-auto pr-2 lg:grid-cols-2">
                  {recentPayments.map((payment) => (
                    <li
                      key={payment.orderId}
                      className="flex items-center justify-between gap-2 border-b-2 border-border py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">{payment.learnerName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {payment.orderNumber ?? `Order #${payment.orderId}`} ·{" "}
                          {formatDateTime(payment.paidAt)}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold tabular-nums text-primary">
                        {money(payment.amount)}
                      </span>
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
    trends,
    revenuePeak,
    planSlices,
    planMix,
    assessments,
    people,
    catalog,
    sales,
    feeds,
    recentPayments,
    learnersPerCertification,
    catalogMix,
    partnershipsQuery.isError,
  ])

  if (metricsQuery.isLoading) return <InstitutionLoadingSkeleton />

  if (metricsQuery.isError && partnershipsQuery.isError) {
    return (
      <div className="space-y-6">
        <InstitutionPageHeader
          title="Dashboard"
          subtitle="Platform overview across learners, organizations, and certifications."
        />
        <InstitutionErrorState
          title="Unable to load platform data"
          description="The dashboard could not reach the REBYU backend. Check that the API is running."
          onRetry={() => {
            metricsQuery.refetch()
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
        subtitle="Platform overview across learners, organizations, and certifications."
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <DashboardRearrangeControls
          rearranging={layout.rearranging}
          onStart={layout.startRearranging}
          onFinish={layout.finishRearranging}
          onCancel={layout.cancelRearranging}
          onReset={layout.resetLayout}
        />
      </div>

      {/* Three headline numbers, then charts. The nine single-number cards this
          replaced were the same weight as each other, so nothing stood out and
          the page read as a wall -- and a lone integer in a large tile is a poor
          use of the space a chart can fill with a comparison. Every series here
          is a real query; the sample-data panels that used to sit here (invented
          months, invented pass rates) are gone rather than chipped. */}
      <DashboardBoard
        tiles={tiles}
        layout={layout.tileLayout}
        editing={layout.rearranging}
        onLayoutChange={layout.handleLayoutChange}
      />
    </div>
  )
}
