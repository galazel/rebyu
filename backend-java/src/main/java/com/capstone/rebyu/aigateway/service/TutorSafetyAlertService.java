package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.TutorSafetyAlert;
import com.capstone.rebyu.aigateway.repository.TutorSafetyAlertRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Records safety alerts from the AI tutor and notifies the platform admins only. Institution
 * admins and department heads neither get a notification nor see the alert: it is handled on
 * the admin's Safety alerts page.
 *
 * A learner typing several alarming messages in a row is one situation, not ten: staff are
 * notified at most once per learner and kind per {@link #RENOTIFY_AFTER}, while every message
 * is still stored on the alert list.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TutorSafetyAlertService {

    static final Duration RENOTIFY_AFTER = Duration.ofMinutes(30);
    private static final String ADMIN_USER_TYPE = "ADMIN";
    private static final int EXCERPT = 500;

    private final TutorSafetyAlertRepository alerts;
    private final LearnerRepository learners;
    private final UserRepository users;
    private final NotificationService notifications;

    /** Maps the Python screen's alert name (self_harm, abuse, threat, data_probe). */
    public static TutorSafetyAlert.Kind kindOf(String alert) {
        if (alert == null) return null;
        try {
            return TutorSafetyAlert.Kind.valueOf(alert.trim().toUpperCase());
        } catch (IllegalArgumentException unknown) {
            return null;
        }
    }

    @Transactional
    public void raise(Long learnerId, TutorSafetyAlert.Kind kind, String surface, String message) {
        if (learnerId == null || kind == null) return;
        Instant now = Instant.now();
        boolean recentlyNotified = alerts.existsByLearnerIdAndKindAndCreatedAtAfter(
                learnerId, kind, now.minus(RENOTIFY_AFTER));
        String excerpt = message == null ? null
                : (message.length() > EXCERPT ? message.substring(0, EXCERPT) : message);
        alerts.save(TutorSafetyAlert.builder()
                .learnerId(learnerId)
                .kind(kind)
                .surface(surface)
                .messageExcerpt(excerpt)
                .createdAt(now)
                .build());
        // INFO, not WARN: an alert is the system working as intended, not a fault to investigate.
        log.info("Tutor safety alert {} for learner {} on {}", kind, learnerId, surface);
        if (!recentlyNotified) notifyStaff(learnerId, kind);
    }

    private void notifyStaff(Long learnerId, TutorSafetyAlert.Kind kind) {
        Learner learner = learners.findById(learnerId).orElse(null);
        String name = displayName(learner);
        String title = titleOf(kind) + ": " + name;
        String body = bodyOf(kind);

        Set<Long> notified = new LinkedHashSet<>();
        for (User admin : users.findByUserType_UserTypeText(ADMIN_USER_TYPE)) {
            if (notified.add(admin.getUserId())) {
                notifications.notify(admin, title, body, "/admin/safety-alerts");
            }
        }
    }

    /** One alert for the admin list, with who wrote it. */
    public record AdminAlertRow(
            Long alertId, Long learnerId, String learnerName, String learnerUsername,
            String kind, String surface, String message, String status,
            Instant createdAt, Instant reviewedAt, String reviewNote) {
    }

    /** Every alert, newest first; {@code openOnly} hides the ones already followed up. */
    @Transactional(readOnly = true)
    public java.util.List<AdminAlertRow> listForAdmin(boolean openOnly) {
        var rows = alerts.findAll(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        Map<Long, Learner> byId = new LinkedHashMap<>();
        learners.findAllById(rows.stream().map(TutorSafetyAlert::getLearnerId).distinct().toList())
                .forEach(learner -> byId.put(learner.getLearnerId(), learner));
        return rows.stream()
                .filter(alert -> !openOnly || alert.getStatus() == TutorSafetyAlert.Status.OPEN)
                .limit(500)
                .map(alert -> {
                    Learner learner = byId.get(alert.getLearnerId());
                    return new AdminAlertRow(alert.getSafetyAlertId(), alert.getLearnerId(), displayName(learner),
                            learner == null ? null : learner.getUsername(), alert.getKind().name(), alert.getSurface(),
                            alert.getMessageExcerpt(), alert.getStatus().name(), alert.getCreatedAt(),
                            alert.getReviewedAt(), alert.getReviewNote());
                })
                .toList();
    }

    @Transactional
    public void review(Long alertId, Long reviewerUserId, String note) {
        TutorSafetyAlert alert = alerts.findById(alertId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Safety alert not found: " + alertId));
        alert.setStatus(TutorSafetyAlert.Status.REVIEWED);
        alert.setReviewedAt(Instant.now());
        alert.setReviewedByUserId(reviewerUserId);
        if (note != null && !note.isBlank()) {
            alert.setReviewNote(note.length() > 500 ? note.substring(0, 500) : note.trim());
        }
        alerts.save(alert);
    }

    private static String displayName(Learner learner) {
        if (learner == null) return "a learner";
        String full = ((learner.getFirstName() == null ? "" : learner.getFirstName()) + " "
                + (learner.getLastName() == null ? "" : learner.getLastName())).trim();
        if (!full.isEmpty()) return full;
        return learner.getUsername() != null ? "@" + learner.getUsername() : "a learner";
    }

    static String titleOf(TutorSafetyAlert.Kind kind) {
        return switch (kind) {
            case SELF_HARM -> "Wellbeing alert";
            case ABUSE -> "Wellbeing alert";
            case THREAT -> "Safety alert";
            case DATA_PROBE -> "Security alert";
        };
    }

    static String bodyOf(TutorSafetyAlert.Kind kind) {
        return switch (kind) {
            case SELF_HARM -> "Wrote to the AI tutor about wanting to hurt themselves. Please check on them today.";
            case ABUSE -> "Told the AI tutor they were abused or assaulted. Please follow your safeguarding process.";
            case THREAT -> "Wrote a threat to hurt someone or attack a place in the AI tutor. Please review it now.";
            case DATA_PROBE -> "Asked the AI tutor for other people's accounts or data. No data was shared.";
        };
    }
}
