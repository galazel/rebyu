package com.capstone.rebyu.user.service;

import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.common.InvitationAcceptanceException;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
import com.capstone.rebyu.notification.repository.LearnerInvitationRepository;
import com.capstone.rebyu.notification.service.InvitationTokenService;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.user.dto.AcceptInvitationResponse;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.mapper.LearnerMapper;
import com.capstone.rebyu.user.repository.LearnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LearnerServiceAcceptInvitationTest {

    private LearnerRepository learnerRepository;
    private LearnerInvitationRepository invitationRepository;
    private InstitutionCertificationLearnerRepository enrollmentRepository;
    private InstitutionCertificateRepository institutionCertRepository;
    private LearnerService service;

    private static final String RAW_TOKEN = "raw-token-abc123";
    private static final String INVITED_EMAIL = "learner@org.test";

    @BeforeEach
    void setUp() {
        learnerRepository = mock(LearnerRepository.class);
        invitationRepository = mock(LearnerInvitationRepository.class);
        enrollmentRepository = mock(InstitutionCertificationLearnerRepository.class);
        institutionCertRepository = mock(InstitutionCertificateRepository.class);
        service = new LearnerService(
                learnerRepository, mock(LearnerMapper.class), invitationRepository,
                enrollmentRepository, institutionCertRepository,
                mock(LearnerCertificationRepository.class),
                new InvitationTokenService(),
                mock(DepartmentLearnerRepository.class),
                mock(AccountDeletionService.class),
                mock(DepartmentRepository.class),
                mock(NotificationService.class),
                mock(com.capstone.rebyu.enrollment.service.OrgEnrollmentProgressService.class));
    }

    private InstitutionCertificate institutionCert() {
        Certification cert = new Certification();
        cert.setCertificationId(7L);
        cert.setTitle("TOPCIT Review");
        return InstitutionCertificate.builder()
                .institutionCertId(3L)
                .certification(cert)
                .totalSlots(10)
                .usedSlots(4)
                .status(InstitutionCertificate.Status.active)
                .build();
    }

    private LearnerInvitation invitation(LearnerInvitation.Status status, LocalDateTime expiresAt) {
        return LearnerInvitation.builder()
                .invitationId(11L)
                .institutionCert(institutionCert())
                .email(INVITED_EMAIL)
                .tokenHash("does-not-matter-mock-returns-it")
                .sentAt(LocalDateTime.now().minusDays(1))
                .expiresAt(expiresAt)
                .status(status)
                .build();
    }

    private Learner learner(Long id) {
        return Learner.builder().learnerId(id).username("l").firstName("A").lastName("B").build();
    }

    @Test
    void validAcceptanceEnrollsAndMarksAccepted() {
        LearnerInvitation inv = invitation(
                LearnerInvitation.Status.PENDING, LocalDateTime.now().plusDays(5));
        when(invitationRepository.findByTokenHash(anyString())).thenReturn(Optional.of(inv));
        when(learnerRepository.findById(9L)).thenReturn(Optional.of(learner(9L)));
        when(enrollmentRepository.existsByInstitutionCertAndLearner(any(), any())).thenReturn(false);
        when(enrollmentRepository.save(any(InstitutionCertificationLearner.class)))
                .thenAnswer(a -> {
                    InstitutionCertificationLearner e = a.getArgument(0);
                    e.setInstitutionCertLearnerId(100L);
                    return e;
                });

        AcceptInvitationResponse response =
                service.acceptInvitation(9L, INVITED_EMAIL, RAW_TOKEN);

        assertEquals(7L, response.certificationId());
        assertEquals("TOPCIT Review", response.certificationTitle());
        assertEquals(100L, response.enrollmentId());
        assertEquals(LearnerInvitation.Status.ACCEPTED, inv.getStatus());
        assertEquals(9L, inv.getLearner().getLearnerId());
        // Slots are NOT changed on acceptance (reserved at send time).
        verify(institutionCertRepository, never()).save(any());
    }

    @Test
    void invalidTokenRejected() {
        when(invitationRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());
        InvitationAcceptanceException ex = assertThrows(InvitationAcceptanceException.class,
                () -> service.acceptInvitation(9L, INVITED_EMAIL, RAW_TOKEN));
        assertEquals(InvitationAcceptanceException.Code.INVALID_TOKEN, ex.code());
    }

    @Test
    void blankTokenRejected() {
        InvitationAcceptanceException ex = assertThrows(InvitationAcceptanceException.class,
                () -> service.acceptInvitation(9L, INVITED_EMAIL, "  "));
        assertEquals(InvitationAcceptanceException.Code.INVALID_TOKEN, ex.code());
    }

    @Test
    void alreadyAcceptedRejected() {
        when(invitationRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(invitation(
                        LearnerInvitation.Status.ACCEPTED, LocalDateTime.now().plusDays(5))));
        assertEquals(InvitationAcceptanceException.Code.ALREADY_ACCEPTED,
                assertThrows(InvitationAcceptanceException.class,
                        () -> service.acceptInvitation(9L, INVITED_EMAIL, RAW_TOKEN)).code());
    }

    @Test
    void revokedRejected() {
        when(invitationRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(invitation(
                        LearnerInvitation.Status.REVOKED, LocalDateTime.now().plusDays(5))));
        assertEquals(InvitationAcceptanceException.Code.INVITATION_REVOKED,
                assertThrows(InvitationAcceptanceException.class,
                        () -> service.acceptInvitation(9L, INVITED_EMAIL, RAW_TOKEN)).code());
    }

    @Test
    void pendingButOverdueExpiresAndRestoresSlot() {
        LearnerInvitation inv = invitation(
                LearnerInvitation.Status.PENDING, LocalDateTime.now().minusDays(1));
        when(invitationRepository.findByTokenHash(anyString())).thenReturn(Optional.of(inv));

        InvitationAcceptanceException ex = assertThrows(InvitationAcceptanceException.class,
                () -> service.acceptInvitation(9L, INVITED_EMAIL, RAW_TOKEN));
        assertEquals(InvitationAcceptanceException.Code.INVITATION_EXPIRED, ex.code());
        assertEquals(LearnerInvitation.Status.EXPIRED, inv.getStatus());
        // Exactly one reserved slot restored: 4 -> 3.
        assertEquals(3, inv.getInstitutionCert().getUsedSlots());
        verify(institutionCertRepository).save(inv.getInstitutionCert());
    }

    @Test
    void emailMismatchRejected() {
        when(invitationRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(invitation(
                        LearnerInvitation.Status.PENDING, LocalDateTime.now().plusDays(5))));
        when(learnerRepository.findById(9L)).thenReturn(Optional.of(learner(9L)));

        assertEquals(InvitationAcceptanceException.Code.EMAIL_MISMATCH,
                assertThrows(InvitationAcceptanceException.class,
                        () -> service.acceptInvitation(9L, "someone.else@org.test", RAW_TOKEN)).code());
        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    void alreadyEnrolledRejected() {
        when(invitationRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(invitation(
                        LearnerInvitation.Status.PENDING, LocalDateTime.now().plusDays(5))));
        when(learnerRepository.findById(9L)).thenReturn(Optional.of(learner(9L)));
        when(enrollmentRepository.existsByInstitutionCertAndLearner(any(), any())).thenReturn(true);

        assertEquals(InvitationAcceptanceException.Code.ALREADY_ENROLLED,
                assertThrows(InvitationAcceptanceException.class,
                        () -> service.acceptInvitation(9L, INVITED_EMAIL, RAW_TOKEN)).code());
        verify(enrollmentRepository, never()).save(any());
    }
}
