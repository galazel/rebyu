package com.capstone.rebyu.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Everyone who has paid the platform, in one list.
 *
 * Money arrives two ways and lands in two tables: a certification purchase is
 * a `completed` row in LEARNER_ORDERS, and a Pro subscription is a row in
 * LEARNER_SUBSCRIPTIONS with a `paid_at`. The dashboard tile shows the latest
 * eight of each; this is the full ledger behind that tile, so the page it
 * feeds can search and export without the ceiling the tile imposed for layout.
 */
@Service
@RequiredArgsConstructor
public class AdminPaymentsService {

    private static final DateTimeFormatter INVOICE_MONTH = DateTimeFormatter.ofPattern("yyyyMM");

    private final JdbcTemplate jdbc;

    /** One payment, whichever table it came from. `kind` is "Certification" or "Pro". */
    public record PaymentRow(
            String key,
            String kind,
            Long learnerId,
            String learnerName,
            String email,
            String reference,
            String item,
            BigDecimal amount,
            LocalDateTime paidAt,
            String status) {}

    public record PaymentsLedger(
            long payers,
            long certificationOrders,
            long proPayments,
            BigDecimal certificationRevenue,
            BigDecimal proRevenue,
            List<PaymentRow> payments) {}

    @Transactional(readOnly = true)
    public PaymentsLedger ledger() {
        List<PaymentRow> rows = new ArrayList<>();
        rows.addAll(certificationOrders());
        rows.addAll(proPayments());
        rows.sort(Comparator.comparing(PaymentRow::paidAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        long payers = rows.stream().map(PaymentRow::learnerId).filter(Objects::nonNull).distinct().count();
        BigDecimal certRevenue = BigDecimal.ZERO;
        BigDecimal proRevenue = BigDecimal.ZERO;
        long orders = 0;
        long pro = 0;
        for (PaymentRow row : rows) {
            BigDecimal amount = row.amount() == null ? BigDecimal.ZERO : row.amount();
            if ("Pro".equals(row.kind())) {
                pro++;
                // Awaiting or rejected money is not revenue until an admin approves it.
                if ("Active".equals(row.status()) || "Ended".equals(row.status())) {
                    proRevenue = proRevenue.add(amount);
                }
            } else {
                orders++;
                certRevenue = certRevenue.add(amount);
            }
        }
        return new PaymentsLedger(payers, orders, pro, certRevenue, proRevenue, rows);
    }

    /**
     * Completed orders with a positive total. A zero-peso order is a free
     * certification: an enrollment, not a payment.
     */
    private List<PaymentRow> certificationOrders() {
        return jdbc.query("""
                select o.order_id, o.order_number, o.total_amount, o.paid_at,
                       l.learner_id, l.username,
                       trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')) full_name,
                       u.email,
                       (select string_agg(c.title, ', ' order by c.title)
                          from learner_order_details d
                          join certifications c on c.certification_id = d.certification_id
                         where d.order_id = o.order_id) items
                from learner_orders o
                join learners l on l.learner_id = o.learner_id
                left join users u on u.user_id = l.user_id
                where o.status = 'completed' and o.total_amount > 0
                order by o.paid_at desc nulls last, o.order_id desc""", (rs, i) -> {
            var paidAt = rs.getTimestamp("paid_at");
            long orderId = rs.getLong("order_id");
            String orderNumber = rs.getString("order_number");
            return new PaymentRow(
                    "order-" + orderId,
                    "Certification",
                    rs.getLong("learner_id"),
                    displayName(rs.getString("full_name"), rs.getString("username"), rs.getLong("learner_id")),
                    rs.getString("email"),
                    orderNumber != null ? orderNumber : "Order #" + orderId,
                    rs.getString("items"),
                    rs.getBigDecimal("total_amount"),
                    paidAt == null ? null : paidAt.toLocalDateTime(),
                    "Paid");
        });
    }

    /** Every Pro subscription that was paid for, whatever happened to it afterwards. */
    private List<PaymentRow> proPayments() {
        return jdbc.query("""
                select s.learner_subscription_id id, s.amount_paid amount, s.paid_at, s.status,
                       s.current_period_start started, s.review_note note,
                       p.plan_name plan_name,
                       l.learner_id, l.username,
                       trim(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'')) full_name,
                       u.email
                from learner_subscriptions s
                join learners l on l.learner_id = s.learner_id
                left join users u on u.user_id = l.user_id
                left join subscription_plans p on p.subscription_plan_id = s.subscription_plan_id
                where s.paid_at is not null
                order by s.paid_at desc""", (rs, i) -> {
            LocalDateTime paidAt = rs.getTimestamp("paid_at").toLocalDateTime();
            String status = rs.getString("status");
            String label = "PENDING".equals(status) ? "Awaiting approval"
                    : "ACTIVE".equals(status) || "TRIALING".equals(status) ? "Active"
                    : rs.getString("note") != null ? "Rejected"
                    : rs.getTimestamp("started") != null ? "Ended" : status;
            long id = rs.getLong("id");
            String plan = rs.getString("plan_name");
            return new PaymentRow(
                    "pro-" + id,
                    "Pro",
                    rs.getLong("learner_id"),
                    displayName(rs.getString("full_name"), rs.getString("username"), rs.getLong("learner_id")),
                    rs.getString("email"),
                    "REBYU-INV-%s-%06d".formatted(paidAt.format(INVOICE_MONTH), id),
                    plan == null ? "Pro" : plan,
                    rs.getBigDecimal("amount"),
                    paidAt,
                    label);
        });
    }

    private static String displayName(String fullName, String username, long learnerId) {
        if (fullName != null && !fullName.isBlank()) return fullName;
        if (username != null && !username.isBlank()) return username;
        return "Learner #" + learnerId;
    }
}
