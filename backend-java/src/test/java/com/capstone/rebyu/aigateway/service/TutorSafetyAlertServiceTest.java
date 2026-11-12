package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.TutorSafetyAlert;
import com.capstone.rebyu.aigateway.repository.TutorSafetyAlertRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Safety alerts notify the platform admins only -- never institution admins or department heads. */
class TutorSafetyAlertServiceTest {

    private final TutorSafetyAlertRepository alerts = mock(TutorSafetyAlertRepository.class);
    private final LearnerRepository learners = mock(LearnerRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final NotificationService notifications = mock(NotificationService.class);

    private TutorSafetyAlertService service;

    private final User platformAdmin = user(3L);

    @BeforeEach
    void setUp() {
        service = new TutorSafetyAlertService(alerts, learners, users, notifications);
        when(learners.findById(anyLong())).thenReturn(Optional.empty());
        when(users.findByUserType_UserTypeText("ADMIN")).thenReturn(List.of(platformAdmin));
    }

    private static User user(long id) {
        User u = new User();
        u.setUserId(id);
        return u;
    }

    @Test
    void onlyPlatformAdminsAreAlerted() {
        service.raise(9L, TutorSafetyAlert.Kind.THREAT, "chat", "...");

        verify(notifications).notify(eq(platformAdmin), anyString(), anyString(), eq("/admin/safety-alerts"));
        verifyNoMoreInteractions(notifications);
    }
}
