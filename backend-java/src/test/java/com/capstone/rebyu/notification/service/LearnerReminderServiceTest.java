package com.capstone.rebyu.notification.service;

import com.capstone.rebyu.gamification.entity.NotificationPreference;
import com.capstone.rebyu.gamification.entity.Streak;
import com.capstone.rebyu.gamification.repository.NotificationPreferenceRepository;
import com.capstone.rebyu.gamification.repository.StreakRepository;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.LearnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LearnerReminderServiceTest {

    private LearnerRepository learners;
    private NotificationPreferenceRepository preferences;
    private StreakRepository streaks;
    private NotificationService notifications;
    private LearnerReminderService service;
    private Learner learner;

    @BeforeEach
    void setUp() {
        learners = mock(LearnerRepository.class);
        preferences = mock(NotificationPreferenceRepository.class);
        streaks = mock(StreakRepository.class);
        notifications = mock(NotificationService.class);
        service = new LearnerReminderService(learners, preferences, streaks, notifications);
        ReflectionTestUtils.setField(service, "streakReminderTime", "20:00");

        learner = Learner.builder()
                .learnerId(7L)
                .user(User.builder().userId(11L).userType(type("LEARNER")).build())
                .build();
        when(learners.findAll()).thenReturn(List.of(learner));
        when(preferences.findByLearner_LearnerId(7L)).thenReturn(Optional.empty());
        when(streaks.findByLearner_LearnerId(7L)).thenReturn(Optional.empty());
    }

    @Test
    void sendsDailyReminderAtTheConfiguredTime() {
        NotificationPreference preference = new NotificationPreference();
        preference.setDailyReminder(true);
        preference.setDailyReminderTime("09:00");
        preference.setStreakReminder(false);
        when(preferences.findByLearner_LearnerId(7L)).thenReturn(Optional.of(preference));

        service.deliverDueReminders(at("2026-10-18T09:00:00+08:00"));

        verify(notifications).notifyOnceSince(eq(learner.getUser()),
                eq(LearnerReminderService.DAILY_TITLE), any(), eq("/learner/learning"), any());
    }

    @Test
    void doesNotSendDisabledDailyReminder() {
        NotificationPreference preference = new NotificationPreference();
        preference.setDailyReminder(false);
        preference.setStreakReminder(false);
        when(preferences.findByLearner_LearnerId(7L)).thenReturn(Optional.of(preference));

        service.deliverDueReminders(at("2026-10-18T09:00:00+08:00"));

        verify(notifications, never()).notifyOnceSince(any(), eq(LearnerReminderService.DAILY_TITLE), any(), any(), any());
    }

    @Test
    void sendsStreakReminderOnlyWhenYesterdayWasTheLastActivity() {
        NotificationPreference preference = new NotificationPreference();
        preference.setDailyReminder(false);
        preference.setStreakReminder(true);
        when(preferences.findByLearner_LearnerId(7L)).thenReturn(Optional.of(preference));
        Streak streak = new Streak();
        streak.setCurrentStreak(4);
        streak.setLastActivityDate(LocalDate.of(2026, 10, 17));
        when(streaks.findByLearner_LearnerId(7L)).thenReturn(Optional.of(streak));

        service.deliverDueReminders(at("2026-10-18T20:00:00+08:00"));

        verify(notifications).notifyOnceSince(eq(learner.getUser()),
                eq(LearnerReminderService.STREAK_TITLE), any(), eq("/learner/learning"), any());
    }

    @Test
    void skipsAccountsThatAreNotLearners() {
        learner.getUser().setUserType(type("ADMIN"));

        service.deliverDueReminders(at("2026-10-18T09:00:00+08:00"));

        verify(notifications, never()).notifyOnceSince(any(), any(), any(), any(), any());
    }

    private static UserType type(String text) {
        UserType type = new UserType();
        type.setUserTypeText(text);
        return type;
    }

    private static ZonedDateTime at(String value) {
        return ZonedDateTime.parse(value).withZoneSameInstant(ZoneId.of("Asia/Manila"));
    }
}
