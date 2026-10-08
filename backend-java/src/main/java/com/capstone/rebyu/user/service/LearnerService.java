package com.capstone.rebyu.user.service;

import com.capstone.rebyu.common.InvitationAcceptanceException;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
import com.capstone.rebyu.notification.repository.LearnerInvitationRepository;
import com.capstone.rebyu.notification.service.InvitationTokenService;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.user.dto.AcceptInvitationResponse;
import com.capstone.rebyu.user.dto.LearnerDto;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.mapper.LearnerMapper;
import com.capstone.rebyu.user.repository.LearnerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LearnerService {

    private final LearnerRepository learnerRepository;
    private final LearnerMapper learnerMapper;
    private final LearnerInvitationRepository learnerInvitationRepository;
    private final InstitutionCertificationLearnerRepository
            institutionCertificationLearnerRepository;
    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final LearnerCertificationRepository learnerCertificationRepository;
    private final InvitationTokenService invitationTokenService;
    private final DepartmentLearnerRepository departmentLearnerRepository;
    private final AccountDeletionService accountDeletionService;
    private final DepartmentRepository departmentRepository;
    private final NotificationService notificationService;
    private final com.capstone.rebyu.enrollment.service.OrgEnrollmentProgressService orgEnrollmentProgressService;

    public List<LearnerDto> getAll() {
        List<Learner> learners = learnerRepository.findAll();

        Map<Long, List<InstitutionCertificationLearner>> orgEnrolmentsByLearner =
                institutionCertificationLearnerRepository.findAll().stream()
                        .filter(row -> row.getLearner() != null)
                        .collect(Collectors.groupingBy(
                                row -> row.getLearner().getLearnerId()));

        Map<Long, Long> individualEnrolmentsByLearner =
                learnerCertificationRepository.findAll().stream()
                        .filter(row -> row.getLearner() != null)
                        .collect(Collectors.groupingBy(
                                row -> row.getLearner().getLearnerId(),
                                Collectors.counting()));

        return learners.stream()
                .map(learner -> enrich(
                        learnerMapper.toDto(learner),
                        learner,
                        orgEnrolmentsByLearner.getOrDefault(
                                learner.getLearnerId(), List.of()),
                        individualEnrolmentsByLearner.getOrDefault(
                                learner.getLearnerId(), 0L)))
                .toList();
    }

    public LearnerDto getById(Long id) {
        Learner learner = findEntity(id);

        return enrich(
                learnerMapper.toDto(learner),
                learner,
                institutionCertificationLearnerRepository
                        .findByLearner_LearnerId(id),
                (long) learnerCertificationRepository
                        .findByLearner_LearnerId(id).size());
    }

    private LearnerDto enrich(
            LearnerDto dto,
            Learner learner,
            List<InstitutionCertificationLearner> orgEnrolments,
            long individualEnrolments) {

        if (learner.getUser() != null) {
            dto.setEmail(learner.getUser().getEmail());
            dto.setJoinedAt(learner.getUser().getJoinedAt());
            dto.setStatus(learner.getUser().getAccountStatus() == null
                    ? null
                    : learner.getUser().getAccountStatus().name());
        }

        String institutionName = orgEnrolments.stream()
                .map(InstitutionCertificationLearner::getInstitutionCert)
                .filter(institutionCert -> institutionCert != null && institutionCert.getInstitution() != null)
                .map(institutionCert -> institutionCert.getInstitution().getInstitutionName())
                .filter(name -> name != null && !name.isBlank())
                .findFirst()
                .orElse(null);

        dto.setInstitutionName(institutionName);
        dto.setLearnerType(institutionName == null ? "individual" : "institution");
        dto.setCertificationCount((int) (orgEnrolments.size() + individualEnrolments));

        dto.setProgressPercentage(orgEnrolments.stream()
                .map(InstitutionCertificationLearner::getProgressPercentage)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0));

        return dto;
    }

    public LearnerDto create(LearnerDto dto) {
        Learner entity = learnerMapper.toEntity(dto);

        entity.setLearnerId(null);

        return learnerMapper.toDto(
                learnerRepository.save(entity)
        );
    }

    public LearnerDto update(Long id, LearnerDto dto) {
        Learner existing = findEntity(id);

        Learner entity = learnerMapper.toEntity(dto);

        entity.setLearnerId(id);

        entity.setAvatarKey(existing.getAvatarKey());

        return learnerMapper.toDto(
                learnerRepository.save(entity)
        );
    }

    public AcceptInvitationResponse acceptInvitation(
            Long authLearnerId, String authEmail, String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.INVALID_TOKEN,
                    "Invitation token is required.");
        }
        String tokenHash = invitationTokenService.hashToken(rawToken.trim());
        log.debug("Accept invitation lookup for token fingerprint={}",
                invitationTokenService.fingerprint(rawToken));

        LearnerInvitation invitation = learnerInvitationRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvitationAcceptanceException(
                        InvitationAcceptanceException.Code.INVALID_TOKEN,
                        "This invitation link is invalid."));

        log.debug("Invitation found id={} status={} email={} expiresAt={}",
                invitation.getInvitationId(), invitation.getStatus(),
                invitation.getEmail(), invitation.getExpiresAt());

        switch (invitation.getStatus()) {
            case ACCEPTED -> throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.ALREADY_ACCEPTED,
                    "This invitation has already been accepted.");
            case REVOKED -> throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.INVITATION_REVOKED,
                    "This invitation was cancelled by the institution.");
            case EXPIRED -> throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.INVITATION_EXPIRED,
                    "This invitation has expired.");
            case PENDING -> {  }
        }

        if (invitation.getExpiresAt() != null
                && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(LearnerInvitation.Status.EXPIRED);
            learnerInvitationRepository.save(invitation);
            restoreSlot(invitation.getInstitutionCert());
            restoreDepartmentSlot(invitation.getDepartment());
            throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.INVITATION_EXPIRED,
                    "This invitation has expired.");
        }

        if (authLearnerId == null) {
            throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.EMAIL_MISMATCH,
                    "Sign in with a learner account to accept this invitation.");
        }
        Learner learner = learnerRepository.findById(authLearnerId)
                .orElseThrow(() -> new InvitationAcceptanceException(
                        InvitationAcceptanceException.Code.NOT_AUTHENTICATED,
                        "Your learner account could not be found."));

        if (authEmail == null
                || !authEmail.trim().equalsIgnoreCase(invitation.getEmail())) {
            throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.EMAIL_MISMATCH,
                    "This invitation was sent to a different email address.");
        }

        InstitutionCertificate institutionCert = invitation.getInstitutionCert();
        if (institutionCert == null) {
            throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.INVALID_TOKEN,
                    "This invitation is no longer valid.");
        }

        if (institutionCertificationLearnerRepository
                .existsByInstitutionCertAndLearner(institutionCert, learner)) {
            throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.ALREADY_ENROLLED,
                    "You already have access to this certification.");
        }

        InstitutionCertificationLearner enrollment =
                InstitutionCertificationLearner.builder()
                        .institutionCert(institutionCert)
                        .learner(learner)
                        .assignedAt(LocalDateTime.now())
                        .progressPercentage(BigDecimal.ZERO)
                        .completedAt(null)
                        .status(InstitutionCertificationLearner.Status.active)
                        .build();
        enrollment = institutionCertificationLearnerRepository.save(enrollment);
        orgEnrollmentProgressService.sync(enrollment);

        if (learner.getUser() != null && institutionCert.getCertification() != null) {
            notificationService.notify(
                    learner.getUser(),
                    "New certification assigned",
                    institutionCert.getInstitution().getInstitutionName() + " gave you access to "
                            + institutionCert.getCertification().getTitle() + ".",
                    "/learner/certifications/" + institutionCert.getCertification().getCertificationId());
        }

        Department group = invitation.getDepartment();
        if (group != null && invitation.getInvitedBy() != null) {
            DepartmentLearner assignee = DepartmentLearner.builder()
                    .department(group)
                    .institutionCertLearner(enrollment)
                    .assignedBy(invitation.getInvitedBy())
                    .assignedAt(LocalDateTime.now())
                    .status(DepartmentLearner.Status.active)
                    .role(DepartmentLearner.Role.member)
                    .section(invitation.getSection())
                    .build();
            departmentLearnerRepository.save(assignee);
            log.info("Learner {} placed into group {} via invitation {}",
                    learner.getLearnerId(), group.getDepartmentId(), invitation.getInvitationId());

            notificationService.notify(
                    invitation.getInvitedBy(),
                    "Invitation accepted",
                    displayNameFor(learner, invitation)
                            + " accepted your invitation to " + group.getDepartmentName() + ".",
                    "/institution/departments/" + group.getDepartmentId() + "?tab=learners");
        }

        boolean learnerChanged = false;
        if (isBlank(learner.getFirstName()) && !isBlank(invitation.getFirstName())) {
            learner.setFirstName(invitation.getFirstName().trim());
            learnerChanged = true;
        }
        if (isBlank(learner.getLastName()) && !isBlank(invitation.getLastName())) {
            learner.setLastName(invitation.getLastName().trim());
            learnerChanged = true;
        }
        if (learnerChanged) {
            learnerRepository.save(learner);
        }

        invitation.setLearner(learner);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitation.setStatus(LearnerInvitation.Status.ACCEPTED);
        learnerInvitationRepository.save(invitation);


        log.info("Learner {} accepted invitation {} for certification {}",
                learner.getLearnerId(), invitation.getInvitationId(),
                institutionCert.getCertification().getCertificationId());

        return new AcceptInvitationResponse(
                "Invitation accepted successfully.",
                institutionCert.getCertification().getCertificationId(),
                institutionCert.getCertification().getTitle(),
                enrollment.getInstitutionCertLearnerId());
    }

    private void restoreDepartmentSlot(Department group) {
        if (group == null) {
            return;
        }
        group.setUsedSlots(Math.max(0, group.getUsedSlots() - 1));
        departmentRepository.save(group);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String displayNameFor(Learner learner, LearnerInvitation invitation) {
        String profileName = joinName(learner.getFirstName(), learner.getLastName());
        if (!isBlank(profileName)) {
            return profileName;
        }
        String invitedName = joinName(invitation.getFirstName(), invitation.getLastName());
        if (!isBlank(invitedName)) {
            return invitedName;
        }
        return isBlank(learner.getUsername()) ? "A learner" : learner.getUsername().trim();
    }

    private String joinName(String firstName, String lastName) {
        return ((isBlank(firstName) ? "" : firstName.trim())
                + " "
                + (isBlank(lastName) ? "" : lastName.trim())).trim();
    }

    private void restoreSlot(InstitutionCertificate institutionCert) {
        if (institutionCert == null) {
            return;
        }
        institutionCert.setUsedSlots(Math.max(0, institutionCert.getUsedSlots() - 1));
        institutionCertificateRepository.save(institutionCert);
    }

    public void delete(Long id) {
        findEntity(id);
        accountDeletionService.deleteLearner(id);
    }

    private Learner findEntity(Long id) {
        return learnerRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Learner not found: " + id
                        )
                );
    }
}