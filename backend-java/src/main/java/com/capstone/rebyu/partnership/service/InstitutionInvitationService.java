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
    private final com.capstone.rebyu.institution.service.SchoolMembershipGuard schoolMembership;
    private final com.capstone.rebyu.auth.service.AccountRoleGuard accountRoles;
    private final com.capstone.rebyu.department.repository.DepartmentLearnerRepository departmentLearnerRepository;


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

    /**
     * Which of the department's certifications the invitation is for: the one asked for, else the
     * section's certification, else the department's only one.
     */
    private InstitutionCertificate resolveCertification(Department group, SendInvitationsRequest request) {
        Long wanted = request.institutionCertId();
        if (wanted == null && request.sectionId() != null) {
            wanted = sectionRepository.findById(request.sectionId())
                    .map(section -> section.getInstitutionCert() == null ? null
                            : section.getInstitutionCert().getInstitutionCertId())
                    .orElse(null);
        }
        if (wanted != null) {
            Long id = wanted;
            return group.getInstitutionCerts().stream()
                    .filter(cert -> id.equals(cert.getInstitutionCertId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessRuleException.InvalidPartnershipRequestException(
                            "This department does not cover that certification."));
        }
        InstitutionCertificate only = group.soleCertification();
        if (only == null) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "Choose which certification to invite the learners to.");
        }
        return only;
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

        List<InstitutionCertificate> certs = resolveCertifications(group, request);
        requireSectionOffers(group, request.sectionId(), certs);
        for (InstitutionCertificate cert : certs) {
            if (cert.getStatus() != InstitutionCertificate.Status.active) {
                throw new BusinessRuleException.InvalidPartnershipRequestException(
                        cert.getCertification().getTitle() + " access is not active.");
            }
        }

        List<String> skipped = new ArrayList<>();
        // Each learner, with the certifications they still need an invitation to.
        LinkedHashMap<String, InvitedLearner> toInvite = new LinkedHashMap<>();
        Map<String, List<InstitutionCertificate>> certsFor = new HashMap<>();
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
            var otherSchool = schoolMembership.otherSchool(email, group.getInstitution().getInstitutionId());
            if (otherSchool.isPresent()) {
                skipped.add(email + " (already belongs to " + otherSchool.get() + ")");
                continue;
            }
            var otherRole = accountRoles.conflictingRole(email, com.capstone.rebyu.auth.service.CognitoAuthService.LEARNER_USER_TYPE);
            if (otherRole.isPresent()) {
                skipped.add(email + " (already has " + com.capstone.rebyu.auth.service.AccountRoleGuard.label(otherRole.get())
                        + " account; learners need their own email)");
                continue;
            }
            var elsewhere = placedElsewhere(email, group, request.sectionId());
            if (elsewhere.isPresent()) {
                skipped.add(email + " (" + elsewhere.get() + ")");
                continue;
            }
            List<InstitutionCertificate> needed = certs.stream()
                    .filter(cert -> !invitationRepository.existsByInstitutionCert_InstitutionCertIdAndEmailIgnoreCaseAndStatus(
                            cert.getInstitutionCertId(), email, LearnerInvitation.Status.PENDING))
                    .toList();
            if (needed.isEmpty()) {
                skipped.add(email + " (already invited)");
                continue;
            }
            toInvite.put(email, new InvitedLearner(
                    trimToNull(entry.firstName()), trimToNull(entry.lastName()), email));
            certsFor.put(email, needed);
        }

        if (toInvite.isEmpty()) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(skipped.isEmpty()
                    ? "No new valid learner emails to invite."
                    : "No one was invited: " + String.join("; ", skipped) + ".");
        }

        int totalInvitations = 0;
        for (InstitutionCertificate cert : certs) {
            long wanted = certsFor.values().stream().filter(list -> list.contains(cert)).count();
            totalInvitations += (int) wanted;
            int remaining = cert.getTotalSlots() - cert.getUsedSlots();
            if (wanted > remaining) {
                throw new BusinessRuleException.InvalidPartnershipRequestException(
                        "The number of invitations exceeds the available " + cert.getCertification().getTitle()
                                + " slots. " + remaining + " slot(s) remaining.");
            }
        }

        int remainingInGroup = group.getTotalSlots() - group.getUsedSlots();
        if (totalInvitations > remainingInGroup) {
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

        String institutionName = group.getInstitution().getInstitutionName();
        LocalDateTime now = LocalDateTime.now();
        List<InvitationDto> created = new ArrayList<>();
        for (InvitedLearner entry : toInvite.values()) {
            String email = entry.email();
            List<InstitutionCertificate> needed = certsFor.get(email);

            // One invitation row per certification (each is its own enrolment and seat), but only
            // the first one's link is emailed: accepting it accepts the rest of the batch too.
            String emailedToken = null;
            for (InstitutionCertificate cert : needed) {
                String rawToken = invitationTokenService.generateRawToken();
                LearnerInvitation savedInvitation = invitationRepository.save(LearnerInvitation.builder()
                        .institutionCert(cert)
                        .department(group)
                        .section(section)
                        .invitedBy(User.builder().userId(request.invitedByUserId()).build())
                        .email(email)
                        .firstName(entry.firstName())
                        .lastName(entry.lastName())
                        .tokenHash(invitationTokenService.hashToken(rawToken))
                        .sentAt(now)
                        .expiresAt(now.plusDays(INVITATION_VALID_DAYS))
                        .status(LearnerInvitation.Status.PENDING)
                        .build());
                created.add(toInvitationDto(savedInvitation));
                log.debug("Invitation created id={} tokenFingerprint={}",
                        savedInvitation.getInvitationId(), invitationTokenService.fingerprint(rawToken));
                if (emailedToken == null) emailedToken = rawToken;
                cert.setUsedSlots(cert.getUsedSlots() + 1);
            }

            String titles = joinTitles(needed);
            emailService.sendInstitutionInvitation(email, institutionName,
                    needed.stream().map(cert -> cert.getCertification().getTitle()).toList(), emailedToken);

            userRepository.findByEmailIgnoreCase(email).ifPresent(existingUser ->
                    notificationService.notify(
                            existingUser,
                            "You've been invited",
                            institutionName + " invited you to " + titles + ". Check your email to accept.",
                            null));
        }

        institutionCertificateRepository.saveAll(certs);
        group.setUsedSlots(group.getUsedSlots() + totalInvitations);
        departmentRepository.save(group);

        log.info("Institution {} invited {} learner(s) to {} certification(s) ({} invitation rows, {} skipped)",
                request.institutionId(), toInvite.size(), certs.size(), created.size(), skipped.size());
        return new SendInvitationsResponse(toInvite.size(), skipped, created);
    }

    /**
     * A learner belongs to one department and one section. Returns why this one cannot be
     * invited here: they already sit in, or have a pending invitation to, a different place.
     */
    private Optional<String> placedElsewhere(String email, Department group, Long sectionId) {
        for (var membership : departmentLearnerRepository
                .findByInstitutionCertLearner_Learner_User_EmailIgnoreCaseAndStatus(
                        email, com.capstone.rebyu.department.entity.DepartmentLearner.Status.active)) {
            if (!samePlace(membership.getDepartment(), membership.getSection(), group, sectionId)) {
                return Optional.of("already in " + placeName(membership.getDepartment(), membership.getSection()));
            }
        }
        LocalDateTime now = LocalDateTime.now();
        for (LearnerInvitation pending : invitationRepository
                .findByEmailIgnoreCaseAndStatusOrderBySentAtDesc(email, LearnerInvitation.Status.PENDING)) {
            if (pending.getExpiresAt() != null && pending.getExpiresAt().isBefore(now)) continue;
            if (pending.getDepartment() == null) continue;
            if (!samePlace(pending.getDepartment(), pending.getSection(), group, sectionId)) {
                return Optional.of("already invited to " + placeName(pending.getDepartment(), pending.getSection()));
            }
        }
        return Optional.empty();
    }

    private static boolean samePlace(Department department,
                                     com.capstone.rebyu.department.entity.InstitutionSection section,
                                     Department group, Long sectionId) {
        return department != null
                && Objects.equals(department.getDepartmentId(), group.getDepartmentId())
                && Objects.equals(section == null ? null : section.getSectionId(), sectionId);
    }

    private static String placeName(Department department,
                                    com.capstone.rebyu.department.entity.InstitutionSection section) {
        String name = department == null ? "another department" : department.getDepartmentName();
        return section == null ? name : name + ", " + section.getSectionName();
    }

    private List<InstitutionCertificate> resolveCertifications(Department group, SendInvitationsRequest request) {
        if (request.institutionCertIds() == null || request.institutionCertIds().isEmpty()) {
            return List.of(resolveCertification(group, request));
        }
        List<InstitutionCertificate> certs = new ArrayList<>();
        for (Long id : new LinkedHashSet<>(request.institutionCertIds())) {
            if (id == null) continue;
            certs.add(group.getInstitutionCerts().stream()
                    .filter(cert -> id.equals(cert.getInstitutionCertId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessRuleException.InvalidPartnershipRequestException(
                            "This department does not cover that certification.")));
        }
        if (certs.isEmpty()) {
            return List.of(resolveCertification(group, request));
        }
        return certs;
    }

    /** A section's learners may only be enrolled in the certifications that section's program offers. */
    private void requireSectionOffers(Department group, Long sectionId, List<InstitutionCertificate> certs) {
        if (sectionId == null) return;
        var section = sectionRepository.findBySectionIdAndDepartment_DepartmentId(sectionId, group.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("That section does not belong to this department."));
        java.util.Set<Long> offered = new java.util.HashSet<>();
        if (section.getProgram() != null) {
            section.getProgram().getInstitutionCerts().forEach(cert -> offered.add(cert.getInstitutionCertId()));
        } else if (section.getInstitutionCert() != null) {
            offered.add(section.getInstitutionCert().getInstitutionCertId());
        } else {
            return;
        }
        for (InstitutionCertificate cert : certs) {
            if (!offered.contains(cert.getInstitutionCertId())) {
                throw new BusinessRuleException.InvalidPartnershipRequestException(
                        section.getSectionName() + "'s program does not offer " + cert.getCertification().getTitle() + ".");
            }
        }
    }

    private static String joinTitles(List<InstitutionCertificate> certs) {
        List<String> titles = certs.stream().map(cert -> cert.getCertification().getTitle()).toList();
        if (titles.size() == 1) return titles.get(0);
        return String.join(", ", titles.subList(0, titles.size() - 1)) + " and " + titles.get(titles.size() - 1);
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
