package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.entity.LearnerSubscription;
import com.capstone.rebyu.notification.service.EmailService;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * The emails a Pro purchase sends: the invoice as soon as PayMongo confirms the
 * payment, and a short "Pro is on" note when an admin approves it.
 *
 * <p>Both are sent after the transaction commits, so a payment that fails to
 * save never mails an invoice, and a failed email never undoes a payment.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceEmailService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("MMMM d, yyyy 'at' h:mm a", Locale.ENGLISH);

    private final EmailService email;
    private final LearnerRepository learners;

    @Value("${app.frontend-url:https://rebyu.online}")
    private String frontendUrl;

    public static String invoiceNumber(LearnerSubscription subscription) {
        LocalDateTime at = subscription.getPaidAt() != null ? subscription.getPaidAt() : subscription.getCreatedAt();
        return "REBYU-INV-%s-%06d".formatted(
                at == null ? "000000" : at.format(DateTimeFormatter.ofPattern("yyyyMM")),
                subscription.getLearnerSubscriptionId());
    }

    /* The recipient and plan are read now, inside the transaction, because the
       lazy learner/user/plan cannot be loaded once it has committed. */
    public void sendInvoiceAfterCommit(LearnerSubscription subscription) {
        Recipient to = recipient(subscription);
        String planName = subscription.getSubscriptionPlan().getPlanName();
        BigDecimal planAmount = subscription.getSubscriptionPlan().getAmount();
        if (to != null) afterCommit(() -> sendInvoice(subscription, to, planName, planAmount));
    }

    public void sendActivationAfterCommit(LearnerSubscription subscription) {
        Recipient to = recipient(subscription);
        if (to != null) afterCommit(() -> sendActivation(subscription, to));
    }

    private void sendInvoice(LearnerSubscription s, Recipient to, String planName, BigDecimal planAmount) {
        String number = invoiceNumber(s);
        String amount = peso(s.getAmountPaid() != null ? s.getAmountPaid() : planAmount);
        String paidAt = s.getPaidAt() == null ? "" : manila(s.getPaidAt());

        String text = """
                Hi %s,

                Thank you for your payment. Here is your invoice.

                Invoice number: %s
                Date paid: %s
                Billed to: %s (%s)

                %s (monthly)          %s
                Total paid:           %s

                Payment processed by PayMongo (test mode).
                Reference: %s

                Status: Paid, waiting for admin approval. Your Pro month starts when it is approved,
                and we will email you when it does.

                View your plan: %s/learner/subscription

                REBYU Team
                """.formatted(to.name, number, paidAt, to.name, to.email, planName, amount, amount,
                s.getProviderSubscriptionId(), base());

        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f1ea;padding:24px">
                  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:14px;overflow:hidden">
                    <div style="background:#2f6b4f;color:#ffffff;padding:20px 24px">
                      <div style="font-size:20px;font-weight:bold">REBYU</div>
                      <div style="font-size:13px;opacity:.85">Invoice %s</div>
                    </div>
                    <div style="padding:24px;color:#2c3a33">
                      <p style="margin:0 0 16px">Hi %s, thank you for your payment.</p>
                      <table style="width:100%%;font-size:14px;border-collapse:collapse;margin-bottom:16px">
                        <tr><td style="color:#6b706c;padding:3px 0">Invoice number</td><td style="text-align:right">%s</td></tr>
                        <tr><td style="color:#6b706c;padding:3px 0">Date paid</td><td style="text-align:right">%s</td></tr>
                        <tr><td style="color:#6b706c;padding:3px 0">Billed to</td><td style="text-align:right">%s<br><span style="color:#6b706c">%s</span></td></tr>
                      </table>
                      <table style="width:100%%;font-size:14px;border-collapse:collapse;border-top:1px solid #e3ddd0;border-bottom:1px solid #e3ddd0">
                        <tr><td style="padding:12px 0">%s <span style="color:#6b706c">· monthly</span></td><td style="text-align:right;padding:12px 0">%s</td></tr>
                      </table>
                      <table style="width:100%%;font-size:16px;font-weight:bold;margin:12px 0 20px">
                        <tr><td>Total paid</td><td style="text-align:right">%s</td></tr>
                      </table>
                      <div style="background:#fbf0d2;border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.5">
                        <b>Paid, waiting for approval.</b> An admin reviews each Pro subscription. Your Pro month starts
                        when it is approved, and we will email you then.
                      </div>
                      <p style="font-size:12px;color:#6b706c;margin:18px 0 0">
                        Processed by PayMongo (test mode) · Reference %s
                      </p>
                      <p style="margin:20px 0 0"><a href="%s/learner/subscription" style="background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:bold">View your plan</a></p>
                    </div>
                  </div>
                </div>
                """.formatted(number, esc(to.name), number, paidAt, esc(to.name), esc(to.email),
                esc(planName), amount, amount, esc(s.getProviderSubscriptionId()), base());

        deliver(to.email, "Your REBYU invoice " + number, text, html);
    }

    private void sendActivation(LearnerSubscription s, Recipient to) {
        String until = s.getCurrentPeriodEnd() == null ? "" : manila(s.getCurrentPeriodEnd());
        String text = """
                Hi %s,

                Your REBYU Pro subscription (invoice %s) has been approved. Pro is active now%s.

                Retakes, mock exams, the AI tutor, the mistake bank, the full community and every challenge are unlocked.

                Start studying: %s/learner/learning

                REBYU Team
                """.formatted(to.name, invoiceNumber(s), until.isEmpty() ? "" : " until " + until, base());
        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f1ea;padding:24px">
                  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:14px;padding:24px;color:#2c3a33">
                    <div style="font-size:20px;font-weight:bold;color:#2f6b4f">REBYU Pro is active</div>
                    <p>Hi %s, your subscription (invoice %s) has been approved.%s</p>
                    <p>Retakes, mock exams, the AI tutor, the mistake bank, the full community and every challenge are unlocked.</p>
                    <p><a href="%s/learner/learning" style="background:#2f6b4f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold">Start studying</a></p>
                  </div>
                </div>
                """.formatted(esc(to.name), invoiceNumber(s), until.isEmpty() ? "" : " Pro runs until " + until + ".", base());
        deliver(to.email, "Your REBYU Pro is active", text, html);
    }

    private void deliver(String to, String subject, String text, String html) {
        try {
            email.sendHtml(to, subject, text, html);
            log.info("Sent '{}' to {}", subject, to);
        } catch (RuntimeException ex) {
            log.error("Could not send '{}' to {}", subject, to, ex);
        }
    }

    private record Recipient(String name, String email) {
    }

    private Recipient recipient(LearnerSubscription s) {
        Long learnerId = s.getLearner() == null ? null : s.getLearner().getLearnerId();
        Learner learner = learnerId == null ? null : learners.findById(learnerId).orElse(null);
        if (learner == null || learner.getUser() == null || learner.getUser().getEmail() == null) {
            log.warn("No email for subscription {}; invoice not sent", s.getLearnerSubscriptionId());
            return null;
        }
        String name = ((learner.getFirstName() == null ? "" : learner.getFirstName()) + " "
                + (learner.getLastName() == null ? "" : learner.getLastName())).trim();
        if (name.isEmpty()) name = learner.getUsername() == null ? "there" : learner.getUsername();
        return new Recipient(name, learner.getUser().getEmail());
    }

    /* The server runs in UTC; learners read Philippine time. */
    private static String manila(LocalDateTime at) {
        return at.atZone(java.time.ZoneId.systemDefault())
                .withZoneSameInstant(AiGenerationQuotaService.LEARNER_ZONE)
                .format(DATE) + " (PHT)";
    }

    private String base() {
        return frontendUrl.replaceAll("/+$", "");
    }

    private static String peso(BigDecimal amount) {
        return "PHP " + (amount == null ? "0.00" : amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString());
    }

    private static String esc(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private static void afterCommit(Runnable task) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    task.run();
                }
            });
        } else {
            task.run();
        }
    }
}
