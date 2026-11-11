package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.TutorSafetyAlert;
import com.capstone.rebyu.aigateway.repository.TutorSafetyAlertRepository;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
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

/** Safety alerts go to the institution admin only -- never to department heads. */
class TutorSafetyAlertServiceTest {

    private final TutorSafetyAlertRepository alerts = mock(TutorSafetyAlertRepository.class);
    private final LearnerRepository learners = mock(LearnerRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final DepartmentLearnerRepository departmentLearners = mock(DepartmentLearnerRepository.class);
    private final InstitutionCertificationLearnerRepository enrollments =
            mock(InstitutionCertificationLearnerRepository.class);
    private final DepartmentHeadRepository institutionAccounts = mock(DepartmentHeadRepository.class);
    private final NotificationService notifications = mock(NotificationService.class);

    private TutorSafetyAlertService service;

    private final User owner = user(1L);
    private final User manager = user(2L);
    private final User platformAdmin = user(3L);

    @BeforeEach
    void setUp() {
        service = new TutorSafetyAlertService(alerts, learners, users, departmentLearners,
                enrollments, institutionAccounts, notifications);
        when(learners.findById(anyLong())).thenReturn(Optional.empty());
        when(departmentLearners.findByInstitutionCertLearner_Learner_LearnerIdAndStatus(
                anyLong(), eq(DepartmentLearner.Status.active))).thenReturn(List.of());
        when(users.findByUserType_UserTypeText("ADMIN")).thenReturn(List.of(platformAdmin));
    }

    private static User user(long id) {
        User u = new User();
        u.setUserId(id);
        return u;
    }

    private void enrolledAt(long institutionId) {
        Institution institution = new Institution();
        institution.setInstitutionId(institutionId);
        InstitutionCertificate cert = new InstitutionCertificate();
        cert.setInstitution(institution);
        InstitutionCertificationLearner enrollment = new InstitutionCertificationLearner();
        enrollment.setInstitutionCert(cert);
        when(enrollments.findByLearner_LearnerIdAndStatus(9L, InstitutionCertificationLearner.Status.active))
                .thenReturn(List.of(enrollment));

        DepartmentHead ownerRow = new DepartmentHead();
        ownerRow.setHeadRole(DepartmentHead.HeadRole.owner);
        ownerRow.setUser(owner);
        DepartmentHead managerRow = new DepartmentHead();
        managerRow.setHeadRole(DepartmentHead.HeadRole.manager);
        managerRow.setUser(manager);
        when(institutionAccounts.findByInstitution_InstitutionId(institutionId))
                .thenReturn(List.of(ownerRow, managerRow));
    }

    @Test
    void onlyTheInstitutionAdminIsAlerted() {
        enrolledAt(5L);

        service.raise(9L, TutorSafetyAlert.Kind.THREAT, "chat", "...");

        verify(notifications).notify(eq(owner), anyString(), anyString(), anyString());
        verify(notifications, never()).notify(eq(manager), anyString(), anyString(), anyString());
        verify(notifications, never()).notify(eq(platformAdmin), anyString(), anyString(), anyString());
    }

    @Test
    void aLearnerWithNoInstitutionFallsBackToThePlatformAdmins() {
        when(enrollments.findByLearner_LearnerIdAndStatus(9L, InstitutionCertificationLearner.Status.active))
                .thenReturn(List.of());

        service.raise(9L, TutorSafetyAlert.Kind.SELF_HARM, "chat", "...");

        verify(notifications).notify(eq(platformAdmin), anyString(), anyString(), eq("/admin/safety-alerts"));
    }
}
