package com.capstone.rebyu.partnership.service;

import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
import com.capstone.rebyu.notification.repository.LearnerInvitationRepository;
import com.capstone.rebyu.notification.service.EmailService;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.CertificationAccessDto;
import com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.InvitationDto;
import com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.InvitedLearner;
import com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.SendInvitationsRequest;
import com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.SendInvitationsResponse;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionInvitationService {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int INVITATION_VALID_DAYS = 14;

    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final LearnerInvitationRepository invitationRepository;
    private final EmailService emailService;
    private final com.capstone.rebyu.notification.service.InvitationTokenService invitationTokenService;
    private final DepartmentRepository departmentRepository;
    private final DepartmentHeadAssignmentRepository departmentHeadAssignmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.capstone.rebyu.department.repository.InstitutionSectionRepository sectionRepository;


    @Transactional(readOnly = true)
    public List<CertificationAccessDto> certificationAccess(Long institutionId) {
        return institutionCertificateRepository.findByInstitution_InstitutionId(institutionId)
                .stream()
                .map(this::toAccessDto)
                .toList();
    }

    @Transactional
    public List<InvitationDto> listInvitations(Long institutionId) {
        List<LearnerInvitation> invitations = invitationRepository
                .findByInstitutionCert_Institution_InstitutionIdOrderBySentAtDesc(institutionId);

        LocalDateTime now = LocalDateTime.now();
        for (LearnerInvitation invitation : invitations) {
            if (invitation.getStatus() == LearnerInvitation.Status.PENDING
                    && invitation.getExpiresAt() != null
                    && invitation.getExpiresAt().isBefore(now)) {
                invitation.setStatus(LearnerInvitation.Status.EXPIRED);
                invitationRepository.save(invitation);
                InstitutionCertificate institutionCert = invitation.getInstitutionCert();
                institutionCert.setUsedSlots(Math.max(0, institutionCert.getUsedSlots() - 1));
                institutionCertificateRepository.save(institutionCert);
                restoreDepartmentSlot(invitation.getDepartment());
                log.info("Invitation {} expired; 1 slot restored on institutionCert {}",
                        invitation.getInvitationId(), institutionCert.getInstitutionCertId());
            }
        }

        return invitations.stream().map(this::toInvitationDto).toList();
    }

    @Transactional
    public SendInvitationsResponse sendInvitations(SendInvitationsRequest request) throws Exception {
        Department group = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Group not found: " + request.departmentId()));

        if (group.getInstitution() == null
                || !group.getInstitution().getInstitutionId().equals(request.institutionId())) {
            throw new EntityNotFoundException("Group not found: " + request.departmentId());
        }
        requireActiveLeader(group, request.invitedByUserId());

        InstitutionCertificate institutionCert = group.getInstitutionCert();
        if (institutionCert.getStatus() != InstitutionCertificate.Status.active) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "This certification access is not active.");
        }

        List<String> skipped = new ArrayList<>();
        LinkedHashMap<String, InvitedLearner> toInvite = new LinkedHashMap<>();
        for (InvitedLearner entry : request.learners()) {
            if (entry == null || entry.email() == null) continue;
            String email = entry.email().trim().toLowerCase(Locale.ROOT);
            if (email.isEmpty()) continue;
            if (!EMAIL.matcher(email).matches()) {
                skipped.add(entry.email() + " (invalid email)");
                continue;
            }
            if (toInvite.containsKey(email)) {
                continue;
            }
            if (invitationRepository.existsByInstitutionCert_InstitutionCertIdAndEmailIgnoreCaseAndStatus(
                    institutionCert.getInstitutionCertId(), email, LearnerInvitation.Status.PENDING)) {
                skipped.add(email + " (already invited)");
                continue;
            }
            toInvite.put(email, new InvitedLearner(
                    trimToNull(entry.firstName()), trimToNull(entry.lastName()), email));
        }

        if (toInvite.isEmpty()) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "No new valid learner emails to invite.");
        }

        int remaining = institutionCert.getTotalSlots() - institutionCert.getUsedSlots();
        if (toInvite.size() > remaining) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "The number of invitations exceeds the available slots. "
                            + remaining + " slot(s) remaining.");
        }

        int remainingInGroup = group.getTotalSlots() - group.getUsedSlots();
        if (toInvite.size() > remainingInGroup) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "The number of invitations exceeds this group's own slot limit. "
                            + remainingInGroup + " slot(s) remaining in this group.");
        }

        com.capstone.rebyu.department.entity.InstitutionSection section = null;
        if (request.sectionId() != null) {
            section = sectionRepository
                    .findBySectionIdAndDepartment_DepartmentId(request.sectionId(), group.getDepartmentId())
                    .filter(s -> s.getStatus() == com.capstone.rebyu.department.entity.InstitutionSection.Status.active)
                    .orElseThrow(() -> new IllegalArgumentException("That section does not belong to this department."));
        }

        LocalDateTime now = LocalDateTime.now();
        List<InvitationDto> created = new ArrayList<>();
        for (InvitedLearner entry : toInvite.values()) {
            String email = entry.email();

            String rawToken = invitationTokenService.generateRawToken();
            String tokenHash = invitationTokenService.hashToken(rawToken);

            LearnerInvitation invitation = LearnerInvitation.builder()
                    .institutionCert(institutionCert)
                    .department(group)
                    .section(section)
                    .invitedBy(User.builder().userId(request.invitedByUserId()).build())
                    .email(email)
                    .firstName(entry.firstName())
                    .lastName(entry.lastName())
                    .tokenHash(tokenHash)
                    .sentAt(now)
                    .expiresAt(now.plusDays(INVITATION_VALID_DAYS))
                    .status(LearnerInvitation.Status.PENDING)
                    .build();

            LearnerInvitation savedInvitation =
                    invitationRepository.save(invitation);

            created.add(toInvitationDto(savedInvitation));

            log.debug("Invitation created id={} tokenFingerprint={}",
                    savedInvitation.getInvitationId(),
                    invitationTokenService.fingerprint(rawToken));

            emailService.sendInstitutionInvitation(
                    savedInvitation.getEmail(),
                    institutionCert.getInstitution().getInstitutionName(),
                    institutionCert.getCertification().getTitle(),
                    rawToken
            );

            userRepository.findByEmailIgnoreCase(email).ifPresent(existingUser ->
                    notificationService.notify(
                            existingUser,
                            "You've been invited",
                            institutionCert.getInstitution().getInstitutionName() + " invited you to "
                                    + institutionCert.getCertification().getTitle() + ". Check your email to accept.",
                            null));
        }

        institutionCert.setUsedSlots(institutionCert.getUsedSlots() + toInvite.size());
        institutionCertificateRepository.save(institutionCert);
        group.setUsedSlots(group.getUsedSlots() + toInvite.size());
        departmentRepository.save(group);

        log.info("Institution {} sent {} invitation(s) for institutionCert {} ({} skipped)",
                request.institutionId(), created.size(), institutionCert.getInstitutionCertId(), skipped.size());
        return new SendInvitationsResponse(created.size(), skipped, created);
    }

    @Transactional
    public InvitationDto cancelInvitation(Long invitationId, Long institutionId, Long callerUserId) {
        LearnerInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Invitation not found: " + invitationId));

        InstitutionCertificate institutionCert = invitation.getInstitutionCert();
        if (!institutionCert.getInstitution().getInstitutionId().equals(institutionId)) {
            throw new EntityNotFoundException("Invitation not found: " + invitationId);
        }
        Department group = invitation.getDepartment();
        if (group == null) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "This invitation predates group scoping and cannot be cancelled here.");
        }
        requireActiveLeader(group, callerUserId);

        if (invitation.getStatus() == LearnerInvitation.Status.PENDING) {
            invitation.setStatus(LearnerInvitation.Status.REVOKED);
            invitationRepository.save(invitation);
            institutionCert.setUsedSlots(Math.max(0, institutionCert.getUsedSlots() - 1));
            institutionCertificateRepository.save(institutionCert);
            restoreDepartmentSlot(group);
            log.info("Invitation {} cancelled; 1 slot restored on institutionCert {}",
                    invitationId, institutionCert.getInstitutionCertId());
        } else {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "Only a pending invitation can be cancelled.");
        }
        return toInvitationDto(invitation);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void restoreDepartmentSlot(Department group) {
        if (group == null) {
            return;
        }
        group.setUsedSlots(Math.max(0, group.getUsedSlots() - 1));
        departmentRepository.save(group);
    }

    private void requireActiveLeader(Department group, Long userId) {
        if (userId == null || !departmentHeadAssignmentRepository.existsByDepartmentAndUserAndStatus(
                group, User.builder().userId(userId).build(), DepartmentHeadAssignment.Status.active)) {
            throw new BusinessRuleException.DepartmentRuleException(
                    "Only this group's leader can manage its invitations.");
        }
    }

    private CertificationAccessDto toAccessDto(InstitutionCertificate institutionCert) {
        int remaining = institutionCert.getTotalSlots() - institutionCert.getUsedSlots();
        return new CertificationAccessDto(
                institutionCert.getInstitutionCertId(),
                institutionCert.getCertification().getCertificationId(),
                institutionCert.getCertification().getTitle(),
                institutionCert.getStatus().name(),
                institutionCert.getTotalSlots(),
                institutionCert.getUsedSlots(),
                remaining
        );
    }

    private InvitationDto toInvitationDto(LearnerInvitation invitation) {
        InstitutionCertificate institutionCert = invitation.getInstitutionCert();
        Department group = invitation.getDepartment();
        return new InvitationDto(
                invitation.getInvitationId(),
                institutionCert.getInstitutionCertId(),
                institutionCert.getCertification().getCertificationId(),
                institutionCert.getCertification().getTitle(),
                group != null ? group.getDepartmentId() : null,
                group != null ? group.getDepartmentName() : null,
                invitation.getEmail(),
                invitation.getFirstName(),
                invitation.getLastName(),
                invitation.getStatus().name(),
                invitation.getSentAt(),
                invitation.getExpiresAt(),
                invitation.getSection() != null ? invitation.getSection().getSectionId() : null,
                invitation.getSection() != null ? invitation.getSection().getSectionName() : null
        );
    }
}
