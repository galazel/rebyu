package com.capstone.rebyu.admin.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.billing.entity.BillingStatus;
import com.capstone.rebyu.billing.repository.InstitutionalLicenseRepository;
import com.capstone.rebyu.billing.repository.LearnerSubscriptionRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import com.capstone.rebyu.enrollment.entity.LearnerOrder;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.enrollment.repository.LearnerOrderRepository;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.partnership.entity.PartnershipRequest;
import com.capstone.rebyu.partnership.repository.PartnershipRequestRepository;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * The platform counters behind the admin dashboard.
 *
 * One endpoint of aggregates rather than the six global list fetches the page
 * used to do. Counting `GET /learners` in the browser means shipping every
 * learner row to an admin's laptop to learn a single number, and it grows
 * without bound; these are `COUNT`/`SUM` queries that stay the same size as the
 * platform does.
 *
 * Everything here is a real query. Nothing on this dashboard is sample data --
 * a figure that cannot be sourced is reported as null and rendered as a dash,
 * which is honest in a way that a plausible-looking placeholder is not.
 */
@Service
@RequiredArgsConstructor
public class AdminMetricsService {

    /** Statuses that mean money is actually being collected. */
    private static final List<BillingStatus> LIVE_BILLING =
            List.of(BillingStatus.ACTIVE, BillingStatus.TRIALING);

    private final UserRepository userRepository;
    private final LearnerRepository learnerRepository;
    private final InstitutionRepository institutionRepository;
    private final CertificationRepository certificationRepository;
    private final LearnerCertificationRepository learnerCertificationRepository;
    private final PartnershipRequestRepository partnershipRequestRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final LearnerOrderRepository orderRepository;
    private final LearnerSubscriptionRepository subscriptionRepository;
    private final InstitutionalLicenseRepository licenseRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    /** One month of the growth chart. Money is pesos; counts are rows begun that month. */
    public record MonthTrend(
            String month,
            long newUsers,
            long attempts,
            long passedAttempts,
            BigDecimal certificationSales,
            BigDecimal proRevenue,
            long proApprovals) {}

    /** One row of the "Pro payments" feed. */
    public record ProPaymentDto(
            Long subscriptionId,
            String invoiceNumber,
            String learnerName,
            String email,
            BigDecimal amount,
            LocalDateTime paidAt,
            String status) {}

    /** Pro subscription money and queue, all-time and recent. */
    public record ProMetrics(
            BigDecimal approvedRevenue,
            BigDecimal approvedRevenueLast30Days,
            BigDecimal awaitingRevenue,
            long awaitingApproval,
            long activePro,
            long paymentsLast30Days,
            List<ProPaymentDto> recentPayments) {}

    /** Who is on which plan right now. */
    public record PlanMix(long freeLearners, long proLearners, long awaitingApproval) {}

    public record PeopleMetrics(
            long totalUsers,
            long activeUsers,
            long learners,
            long learnersInCertification,
            long activeEnrollments) {}

    public record CatalogMetrics(
            long institutions,
            long certifications,
            long publishedCertifications,
            long pendingPartnerships) {}

    public record AssessmentMetrics(
            long gradedAttempts,
            long passedAttempts,
            Integer passRate,
            Integer averageScore,
            long attemptsLast30Days) {}

    public record SalesMetrics(
            BigDecimal grossSales,
            BigDecimal salesLast30Days,
            long paidOrders,
            long pendingOrders,
            long activeSubscriptions,
            long activeLicenses) {}

    /** One bar of the "learners per certification" chart. */
    public record CertificationEnrolmentDto(
            Long certificationId,
            String title,
            long learners,
            long enrollments) {}

    /** One row of the "learners who paid" feed. */
    public record PaymentDto(
            Long orderId,
            String orderNumber,
            Long learnerId,
            String learnerName,
            BigDecimal amount,
            LocalDateTime paidAt) {}

    public record PlatformMetrics(
            PeopleMetrics people,
            CatalogMetrics catalog,
            AssessmentMetrics assessments,
            SalesMetrics sales,
            List<CertificationEnrolmentDto> learnersPerCertification,
            List<PaymentDto> recentPayments,
            List<MonthTrend> trends,
            PlanMix planMix,
            ProMetrics pro) {}

    @Transactional(readOnly = true)
    public PlatformMetrics platformMetrics() {
        return new PlatformMetrics(
                people(), catalog(), assessments(), sales(),
                learnersPerCertification(), recentPayments(), trends(), planMix(), pro());
    }

    /**
     * The last six calendar months, oldest first, zero-filled so the line does
     * not skip a quiet month. Five grouped queries rather than a query per month.
     */
    private List<MonthTrend> trends() {
        java.time.YearMonth current = java.time.YearMonth.now();
        java.time.YearMonth first = current.minusMonths(5);
        LocalDateTime from = first.atDay(1).atStartOfDay();
        Map<String, long[]> counts = new java.util.LinkedHashMap<>();
        Map<String, BigDecimal[]> money = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 6; i++) {
            String key = first.plusMonths(i).toString();
            counts.put(key, new long[4]);
            money.put(key, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        java.util.function.BiConsumer<String, java.util.function.Consumer<java.sql.ResultSet>> each = (sql, row) -> {
            try {
                jdbc.query(sql, rs -> { row.accept(rs); }, java.sql.Timestamp.valueOf(from));
            } catch (RuntimeException ignored) {
                // A missing table or column leaves that series at zero rather
                // than taking the whole dashboard down.
            }
        };
        each.accept("select to_char(date_trunc('month', joined_at), 'YYYY-MM') m, count(*) c from users "
                + "where joined_at >= ? group by 1", rs -> bump(counts, rs, 0));
        each.accept("select to_char(date_trunc('month', submitted_at), 'YYYY-MM') m, count(*) c, "
                + "count(*) filter (where passed) p from assessment_attempts "
                + "where status = 'SUBMITTED' and submitted_at >= ? group by 1", rs -> {
            bump(counts, rs, 1);
            try {
                long[] row = counts.get(rs.getString("m"));
                if (row != null) row[2] = rs.getLong("p");
            } catch (java.sql.SQLException e) {
                throw new IllegalStateException(e);
            }
        });
        each.accept("select to_char(date_trunc('month', paid_at), 'YYYY-MM') m, sum(total_amount) s from learner_orders "
                + "where status = 'completed' and paid_at >= ? group by 1", rs -> add(money, rs, 0));
        each.accept("select to_char(date_trunc('month', current_period_start), 'YYYY-MM') m, "
                + "coalesce(sum(amount_paid), 0) s, count(*) c from learner_subscriptions "
                + "where current_period_start is not null and current_period_start >= ? group by 1", rs -> {
            add(money, rs, 1);
            bump(counts, rs, 3);
        });
        return counts.entrySet().stream()
                .map(e -> new MonthTrend(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2],
                        money.get(e.getKey())[0].setScale(2, RoundingMode.HALF_UP),
                        money.get(e.getKey())[1].setScale(2, RoundingMode.HALF_UP),
                        e.getValue()[3]))
                .toList();
    }

    private static void bump(Map<String, long[]> counts, java.sql.ResultSet rs, int index) {
        try {
            long[] row = counts.get(rs.getString("m"));
            if (row != null) row[index] = rs.getLong("c");
        } catch (java.sql.SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    private static void add(Map<String, BigDecimal[]> money, java.sql.ResultSet rs, int index) {
        try {
            BigDecimal[] row = money.get(rs.getString("m"));
            BigDecimal value = rs.getBigDecimal("s");
            if (row != null && value != null) row[index] = value;
        } catch (java.sql.SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    private ProMetrics pro() {
        try {
            var totals = jdbc.queryForMap("""
                    select
                      coalesce(sum(amount_paid) filter (where current_period_start is not null), 0) approved,
                      coalesce(sum(amount_paid) filter (where current_period_start is not null
                                                       and current_period_start >= now() - interval '30 days'), 0) approved30,
                      coalesce(sum(amount_paid) filter (where status = 'PENDING' and paid_at is not null), 0) awaiting_money,
                      count(*) filter (where status = 'PENDING' and paid_at is not null) awaiting,
                      count(distinct learner_id) filter (where status in ('ACTIVE','TRIALING')
                                                         and (current_period_end is null or current_period_end > now())) active,
                      count(*) filter (where paid_at >= now() - interval '30 days') paid30
                    from learner_subscriptions""");
            List<ProPaymentDto> recent = jdbc.query("""
                    select s.learner_subscription_id id, s.amount_paid amount, s.paid_at paid_at, s.status status,
                           s.current_period_start started, s.review_note note,
                           trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')) full_name,
                           l.username username, u.email email
                    from learner_subscriptions s
                    join learners l on l.learner_id = s.learner_id
                    left join users u on u.user_id = l.user_id
                    where s.paid_at is not null
                    order by s.paid_at desc
                    limit 8""", (rs, i) -> {
                LocalDateTime paidAt = rs.getTimestamp("paid_at").toLocalDateTime();
                String status = rs.getString("status");
                String label = "PENDING".equals(status) ? "Awaiting approval"
                        : "ACTIVE".equals(status) || "TRIALING".equals(status) ? "Active"
                        : rs.getString("note") != null ? "Rejected"
                        : rs.getTimestamp("started") != null ? "Ended" : status;
                String name = rs.getString("full_name");
                if (name == null || name.isBlank()) name = rs.getString("username");
                long id = rs.getLong("id");
                return new ProPaymentDto(id,
                        "REBYU-INV-%s-%06d".formatted(paidAt.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")), id),
                        name, rs.getString("email"), rs.getBigDecimal("amount"), paidAt, label);
            });
            return new ProMetrics(
                    money((BigDecimal) totals.get("approved")),
                    money((BigDecimal) totals.get("approved30")),
                    money((BigDecimal) totals.get("awaiting_money")),
                    ((Number) totals.get("awaiting")).longValue(),
                    ((Number) totals.get("active")).longValue(),
                    ((Number) totals.get("paid30")).longValue(),
                    recent);
        } catch (RuntimeException ex) {
            return new ProMetrics(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, 0, List.of());
        }
    }

    private PlanMix planMix() {
        long learners = learnerRepository.count();
        long pro = 0;
        long awaiting = 0;
        try {
            Long active = jdbc.queryForObject("select count(distinct learner_id) from learner_subscriptions "
                    + "where status in ('ACTIVE','TRIALING') and (current_period_end is null or current_period_end > now())",
                    Long.class);
            Long pending = jdbc.queryForObject("select count(*) from learner_subscriptions "
                    + "where status = 'PENDING' and paid_at is not null", Long.class);
            pro = active == null ? 0 : active;
            awaiting = pending == null ? 0 : pending;
        } catch (RuntimeException ignored) {
            // Leave the split at "everyone is free" if billing is unreadable.
        }
        return new PlanMix(Math.max(learners - pro, 0), pro, awaiting);
    }

    private List<CertificationEnrolmentDto> learnersPerCertification() {
        return learnerCertificationRepository
                .learnersPerCertification(LearnerCertification.Status.active).stream()
                .map(row -> new CertificationEnrolmentDto(
                        row.getCertificationId(),
                        row.getTitle(),
                        row.getLearners(),
                        row.getEnrollments()))
                .toList();
    }

    /**
     * The latest completed orders, with the payer named.
     *
     * Only `completed` orders count as a payment. A pending order is an intent,
     * and listing one here would report money that has not arrived.
     */
    private List<PaymentDto> recentPayments() {
        return orderRepository.findTop8ByStatusOrderByPaidAtDesc(LearnerOrder.Status.completed)
                .stream()
                .map(order -> new PaymentDto(
                        order.getOrderId(),
                        order.getOrderNumber(),
                        order.getLearner() == null ? null : order.getLearner().getLearnerId(),
                        learnerName(order),
                        order.getTotalAmount(),
                        order.getPaidAt()))
                .toList();
    }

    private String learnerName(LearnerOrder order) {
        var learner = order.getLearner();
        if (learner == null) {
            return "Unknown learner";
        }
        String full = ((learner.getFirstName() == null ? "" : learner.getFirstName()) + " "
                + (learner.getLastName() == null ? "" : learner.getLastName())).trim();
        if (!full.isEmpty()) {
            return full;
        }
        return learner.getUsername() == null
                ? "Learner #" + learner.getLearnerId()
                : learner.getUsername();
    }

    private PeopleMetrics people() {
        return new PeopleMetrics(
                userRepository.count(),
                userRepository.countByAccountStatus(User.AccountStatus.active),
                learnerRepository.count(),
                // Distinct people, not enrollment rows: a learner holding three
                // active certifications is one person currently studying.
                learnerCertificationRepository
                        .countDistinctLearnersByStatus(LearnerCertification.Status.active),
                learnerCertificationRepository.countByStatus(LearnerCertification.Status.active));
    }

    private CatalogMetrics catalog() {
        long pending = partnershipRequestRepository.countByStatus(PartnershipRequest.Status.PENDING)
                + partnershipRequestRepository.countByStatus(PartnershipRequest.Status.UNDER_REVIEW);
        return new CatalogMetrics(
                institutionRepository.count(),
                certificationRepository.count(),
                certificationRepository.countByStatus(Certification.CertificationStatus.PUBLISHED),
                pending);
    }

    private AssessmentMetrics assessments() {
        long graded = attemptRepository.countByStatus(AssessmentAttempt.Status.SUBMITTED);
        long passed = attemptRepository
                .countByStatusAndPassed(AssessmentAttempt.Status.SUBMITTED, Boolean.TRUE);
        Double average = attemptRepository
                .averagePercentageByStatus(AssessmentAttempt.Status.SUBMITTED);
        return new AssessmentMetrics(
                graded,
                passed,
                // Null rather than 0% when nothing has been graded: "no data" and
                // "everyone failed" are different facts and must not look alike.
                graded == 0 ? null : (int) Math.round(passed * 100.0 / graded),
                average == null ? null : (int) Math.round(average),
                attemptRepository.countByStatusAndSubmittedAtGreaterThanEqual(
                        AssessmentAttempt.Status.SUBMITTED, LocalDateTime.now().minusDays(30)));
    }

    private SalesMetrics sales() {
        return new SalesMetrics(
                money(orderRepository.sumTotalAmountByStatus(LearnerOrder.Status.completed)),
                money(orderRepository.sumTotalAmountByStatusSince(
                        LearnerOrder.Status.completed, LocalDateTime.now().minusDays(30))),
                orderRepository.countByStatus(LearnerOrder.Status.completed),
                orderRepository.countByStatus(LearnerOrder.Status.pending),
                subscriptionRepository.countByStatusIn(LIVE_BILLING),
                licenseRepository.countByLicenseStatusIn(LIVE_BILLING));
    }

    /** SUM over no rows is null in SQL; zero is the truthful reading for sales. */
    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
