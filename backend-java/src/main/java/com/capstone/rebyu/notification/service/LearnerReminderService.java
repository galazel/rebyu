package com.capstone.rebyu.notification.service;

import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.gamification.entity.NotificationPreference;
import com.capstone.rebyu.gamification.entity.Streak;
import com.capstone.rebyu.gamification.repository.NotificationPreferenceRepository;
import com.capstone.rebyu.gamification.repository.StreakRepository;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

/** Delivers opt-in in-app study and streak reminders in the learner time zone. */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearnerReminderService {

    static final ZoneId LEARNER_ZONE = ZoneId.of("Asia/Manila");
    static final String DAILY_TITLE = "Daily study reminder";
    static final String STREAK_TITLE = "Keep your study streak going";

    private final LearnerRepository learners;
    private final NotificationPreferenceRepository preferences;
    private final StreakRepository streaks;
    private final NotificationService notifications;

    @Value("${notifications.streak-reminder-time:20:00}")
    private String streakReminderTime;

    // One transaction per run, so each learner's lazily loaded user can be read.
    @Scheduled(
            fixedDelayString = "${notifications.reminder-check-ms:60000}",
            initialDelayString = "${notifications.reminder-initial-delay-ms:60000}")
    @Transactional
    public void deliverDueReminders() {
        deliverDueReminders(ZonedDateTime.now(LEARNER_ZONE));
    }

    void deliverDueReminders(ZonedDateTime now) {
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.withSecond(0).withNano(0).toLocalTime();
        OffsetDateTime startOfToday = today.atStartOfDay(LEARNER_ZONE).toOffsetDateTime();
        LocalTime configuredStreakTime = parseTime(streakReminderTime).orElse(LocalTime.of(20, 0));

        for (Learner learner : learners.findAll()) {
            // Admin and institution accounts can carry a learner row too; study nudges are for learners only.
            if (learner.getUser() == null || learner.getUser().getUserType() == null
                    || !CognitoAuthService.LEARNER_USER_TYPE.equalsIgnoreCase(learner.getUser().getUserType().getUserTypeText())) {
                continue;
            }
            NotificationPreference preference = preferences
                    .findByLearner_LearnerId(learner.getLearnerId())
                    .orElse(null);

            if ((preference == null || !Boolean.FALSE.equals(preference.getDailyReminder()))
                    && parseTime(preference == null ? null : preference.getDailyReminderTime())
                    .orElse(LocalTime.of(9, 0)).equals(currentTime)) {
                notifications.notifyOnceSince(
                        learner.getUser(), DAILY_TITLE,
                        "Set aside a few minutes for your learning today.",
                        "/learner/learning", startOfToday);
            }

            if ((preference == null || !Boolean.FALSE.equals(preference.getStreakReminder()))
                    && configuredStreakTime.equals(currentTime)) {
                streaks.findByLearner_LearnerId(learner.getLearnerId())
                        .filter(streak -> isAtRisk(streak, today))
                        .ifPresent(streak -> notifications.notifyOnceSince(
                                learner.getUser(), STREAK_TITLE,
                                "Study today to protect your " + streak.getCurrentStreak() + "-day streak.",
                                "/learner/learning", startOfToday));
            }
        }
    }

    private static boolean isAtRisk(Streak streak, LocalDate today) {
        return streak.getCurrentStreak() != null
                && streak.getCurrentStreak() > 0
                && today.minusDays(1).equals(streak.getLastActivityDate());
    }

    private static Optional<LocalTime> parseTime(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalTime.parse(value));
        } catch (RuntimeException ignored) {
            log.warn("Ignoring invalid notification reminder time: {}", value);
            return Optional.empty();
        }
    }
}
