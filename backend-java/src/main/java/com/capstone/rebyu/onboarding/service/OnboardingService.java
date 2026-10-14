package com.capstone.rebyu.onboarding.service;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.auth.service.IdentityChangedEvent;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import com.capstone.rebyu.notification.service.EmailService;
import com.capstone.rebyu.onboarding.entity.DepartmentHeadInvitation;
import com.capstone.rebyu.onboarding.repository.DepartmentHeadInvitationRepository;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.partnership.entity.PartnershipRequest;
import com.capstone.rebyu.partnership.repository.PartnershipRequestRepository;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.UserRepository;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_DAYS_VALID = 14;
    private static final SecureRandom RANDOM = new SecureRandom();

    public record InvitationView(Long invitationId, Long departmentId, String email, String status,
                                 LocalDateTime createdAt, LocalDateTime expiresAt, String accountName) {
    }

    public record ClaimResult(Long institutionId, String institutionName, Long departmentId, String departmentName) {
    }

    private final InstitutionRepository institutionRepository;
    private final PartnershipRequestRepository partnershipRequestRepository;
    private final DepartmentHeadRepository departmentHeadRepository;
    private final DepartmentHeadAssignmentRepository assignmentRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentHeadInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final com.capstone.rebyu.user.repository.LearnerRepository learnerRepository;
    private final UserTypeRepository userTypeRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher events;
    private final com.capstone.rebyu.institution.service.SchoolMembershipGuard schoolMembership;

    @Transactional
    public ClaimResult registerInstitution(CurrentUserDto caller, String referenceNumber) {
        PartnershipRequest request = partnershipRequestRepository.findByReferenceNumber(normalize(referenceNumber))
                .filter(row -> row.getInstitutionEmail() != null
                        && row.getInstitutionEmail().equalsIgnoreCase(caller.email()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "No partnership request matches that reference number and your email address."));
        if (request.getStatus() == PartnershipRequest.Status.CANCELLED) {
            throw new IllegalArgumentException("This partnership request was cancelled. Submit a new request.");
        }
        User user = loadUser(caller);

        Institution institution = request.getInstitution() != null
                ? request.getInstitution()
                : institutionRepository.findByPrimaryContactEmailIgnoreCase(request.getInstitutionEmail())
                        .orElseGet(() -> institutionRepository.save(Institution.builder()
                                .institutionName(uniqueName(request))
                                .institutionType(Institution.InstitutionType.other)
                                .primaryContactName(request.getContactPersonName())
                                .primaryContactEmail(request.getInstitutionEmail())
                                .primaryContactPhone(request.getContactNumber())
                                .address(request.getInstitutionAddress())
                                .isVerified(false)
                                .joinedAt(LocalDateTime.now())
                                .build()));
        if (request.getInstitution() == null) {
            request.setInstitution(institution);
            partnershipRequestRepository.save(request);
        }

        List<DepartmentHead> owners = departmentHeadRepository
                .findByInstitution_InstitutionId(institution.getInstitutionId()).stream()
                .filter(member -> member.getHeadRole() == DepartmentHead.HeadRole.owner)
                .toList();
        boolean ownedByCaller = owners.stream()
                .anyMatch(member -> member.getUser().getUserId().equals(user.getUserId()));
        if (!owners.isEmpty() && !ownedByCaller) {
            throw new IllegalArgumentException("This institution already has an account. Sign in instead.");
        }

        setUserType(user, CognitoAuthService.INSTITUTION_USER_TYPE);
        if (!ownedByCaller) {
            departmentHeadRepository.save(DepartmentHead.builder()
                    .institution(institution)
                    .user(user)
                    .headRole(DepartmentHead.HeadRole.owner)
                    .isPrimaryContact(true)
                    .firstName(caller.firstName())
                    .lastName(caller.lastName())
                    .joinedAt(LocalDateTime.now())
                    .build());
        }
        events.publishEvent(new IdentityChangedEvent(user.getCognitoSub()));
        log.info("User {} registered institution {} with request {}", user.getUserId(),
                institution.getInstitutionId(), request.getReferenceNumber());
        return new ClaimResult(institution.getInstitutionId(), institution.getInstitutionName(), null, null);
    }

    private String uniqueName(PartnershipRequest request) {
        String name = request.getInstitutionName();
        return institutionRepository.findByInstitutionNameIgnoreCase(name).isPresent()
                ? name + " (" + request.getReferenceNumber() + ")"
                : name;
    }

    @Transactional
    public InvitationView inviteDepartmentHead(CurrentUserDto caller, Long departmentId, String email) {
        requireOwner(caller);
        Department department = ownedDepartment(caller, departmentId);
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        schoolMembership.requireNoOtherSchool(cleanEmail, department.getInstitution().getInstitutionId());
        if (assignmentRepository.existsByUser_EmailIgnoreCaseAndStatusAndDepartment_DepartmentIdNot(
                cleanEmail, DepartmentHeadAssignment.Status.active, departmentId)) {
            throw new IllegalArgumentException(
                    "This person already heads another department. Remove them there first.");
        }

        invitationRepository.findByDepartment_DepartmentIdAndEmailIgnoreCaseAndStatus(
                        departmentId, cleanEmail, DepartmentHeadInvitation.Status.PENDING)
                .forEach(old -> old.setStatus(DepartmentHeadInvitation.Status.CANCELLED));

        LocalDateTime now = LocalDateTime.now();
        DepartmentHeadInvitation invitation = invitationRepository.save(DepartmentHeadInvitation.builder()
                .department(department)
                .email(cleanEmail)
                .code(newCode())
                .invitedBy(userRepository.getReferenceById(caller.userId()))
                .status(DepartmentHeadInvitation.Status.PENDING)
                .createdAt(now)
                .expiresAt(now.plusDays(CODE_DAYS_VALID))
                .build());

        emailService.sendDepartmentHeadCode(cleanEmail, department.getInstitution().getInstitutionName(),
                department.getDepartmentName(), invitation.getCode(), CODE_DAYS_VALID);
        return toView(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationView> listInvitations(CurrentUserDto caller, Long departmentId) {
        requireOwner(caller);
        ownedDepartment(caller, departmentId);
        return invitationRepository.findByDepartment_DepartmentIdOrderByCreatedAtDesc(departmentId).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public InvitationView cancelInvitation(CurrentUserDto caller, Long invitationId) {
        requireOwner(caller);
        DepartmentHeadInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new EntityNotFoundException("Invitation not found"));
        ownedDepartment(caller, invitation.getDepartment().getDepartmentId());
        if (invitation.getStatus() == DepartmentHeadInvitation.Status.PENDING) {
            invitation.setStatus(DepartmentHeadInvitation.Status.CANCELLED);
        }
        return toView(invitation);
    }

    public record CodeLookup(String email, String institutionName, String departmentName) {
    }

    /** Public: the email a usable code was sent to, so the sign-up form can fill it in. */
    @Transactional(readOnly = true)
    public CodeLookup lookupDepartmentHeadCode(String rawCode) {
        DepartmentHeadInvitation invitation = invitationRepository.findByCode(normalize(rawCode))
                .filter(found -> found.getStatus() == DepartmentHeadInvitation.Status.PENDING)
                .filter(found -> found.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "That code is not valid, was already used, or has expired."));
        Department department = invitation.getDepartment();
        return new CodeLookup(invitation.getEmail(), department.getInstitution().getInstitutionName(),
                department.getDepartmentName());
    }

    @Transactional
    public ClaimResult redeemDepartmentHeadCode(CurrentUserDto caller, String rawCode) {
        DepartmentHeadInvitation invitation = invitationRepository.findByCode(normalize(rawCode))
                .orElseThrow(() -> new IllegalArgumentException("That code is not valid."));
        if (!invitation.getEmail().equalsIgnoreCase(caller.email())) {
            throw new IllegalArgumentException(
                    "This code was sent to a different email. Sign in with the address that received it.");
        }
        if (invitation.getStatus() == DepartmentHeadInvitation.Status.CANCELLED) {
            throw new IllegalArgumentException("This code was cancelled by your institution.");
        }
        if (invitation.getStatus() == DepartmentHeadInvitation.Status.REDEEMED) {
            throw new IllegalArgumentException("This code has already been used.");
        }
        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This code has expired. Ask your institution to send a new one.");
        }

        Department department = invitation.getDepartment();
        Institution institution = department.getInstitution();
        schoolMembership.requireNoOtherSchool(caller.email(), institution.getInstitutionId());
        User user = loadUser(caller);
        if (assignmentRepository.existsByUser_UserIdAndStatusAndDepartment_DepartmentIdNot(
                user.getUserId(), DepartmentHeadAssignment.Status.active, department.getDepartmentId())) {
            throw new IllegalArgumentException(
                    "You already head another department. A department head can handle only one.");
        }

        List<DepartmentHead> memberships = departmentHeadRepository
                .findByInstitution_InstitutionIdAndUser_UserId(institution.getInstitutionId(), user.getUserId());
        boolean ownerOfThisInstitution = memberships.stream()
                .anyMatch(member -> member.getHeadRole() == DepartmentHead.HeadRole.owner);
        if (memberships.isEmpty()) {
            departmentHeadRepository.save(DepartmentHead.builder()
                    .institution(institution)
                    .user(user)
                    .headRole(DepartmentHead.HeadRole.manager)
                    .isPrimaryContact(false)
                    .firstName(caller.firstName())
                    .lastName(caller.lastName())
                    .joinedAt(LocalDateTime.now())
                    .build());
        }

        DepartmentHeadAssignment assignment = assignmentRepository.findByDepartmentAndUser(department, user)
                .orElseGet(() -> DepartmentHeadAssignment.builder().department(department).user(user).build());
        assignment.setStatus(DepartmentHeadAssignment.Status.active);
        assignment.setAssignedBy(invitation.getInvitedBy());
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setRemovedAt(null);
        assignmentRepository.save(assignment);

        if (!ownerOfThisInstitution) {
            setUserType(user, CognitoAuthService.DEPARTMENT_HEAD_USER_TYPE);
        }
        invitation.setStatus(DepartmentHeadInvitation.Status.REDEEMED);
        invitation.setRedeemedAt(LocalDateTime.now());
        events.publishEvent(new IdentityChangedEvent(user.getCognitoSub()));
        log.info("User {} redeemed a department head code for department {}", user.getUserId(),
                department.getDepartmentId());
        return new ClaimResult(institution.getInstitutionId(), institution.getInstitutionName(),
                department.getDepartmentId(), department.getDepartmentName());
    }

    private Department ownedDepartment(CurrentUserDto caller, Long departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Department not found: " + departmentId));
        if (department.getInstitution() == null
                || !department.getInstitution().getInstitutionId().equals(caller.institutionId())) {
            throw new EntityNotFoundException("Department not found: " + departmentId);
        }
        return department;
    }

    private void requireOwner(CurrentUserDto caller) {
        if (caller.institutionId() == null || !"owner".equalsIgnoreCase(caller.departmentHeadRole())) {
            throw new AccessDeniedException("Only Institution Administrators can invite department heads.");
        }
    }

    private User loadUser(CurrentUserDto caller) {
        return userRepository.findById(caller.userId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private void setUserType(User user, String typeText) {
        if (user.getUserType() != null && typeText.equalsIgnoreCase(user.getUserType().getUserTypeText())) {
            return;
        }
        UserType type = userTypeRepository.findByUserTypeText(typeText).orElseGet(() -> {
            UserType created = new UserType();
            created.setUserTypeText(typeText);
            return userTypeRepository.save(created);
        });
        user.setUserType(type);
        userRepository.save(user);
    }

    private String newCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder("DH-");
            for (int i = 0; i < 8; i++) {
                builder.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            code = builder.toString();
        } while (invitationRepository.existsByCode(code));
        return code;
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("A code is required.");
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private InvitationView toView(DepartmentHeadInvitation invitation) {
        return new InvitationView(invitation.getDepartmentHeadInvitationId(),
                invitation.getDepartment().getDepartmentId(), invitation.getEmail(),
                invitation.getStatus().name(), invitation.getCreatedAt(), invitation.getExpiresAt(),
                accountName(invitation.getEmail()));
    }

    /** The name on the account registered with this email, or null while none exists yet. */
    private String accountName(String email) {
        return learnerRepository.findByUser_EmailIgnoreCase(email)
                .map(learner -> ((learner.getFirstName() == null ? "" : learner.getFirstName()) + " "
                        + (learner.getLastName() == null ? "" : learner.getLastName())).trim())
                .filter(name -> !name.isBlank())
                .orElse(null);
    }
}
