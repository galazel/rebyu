package com.capstone.rebyu.accountdeletion.service;

import com.capstone.rebyu.accountdeletion.entity.AccountDeletionRequest;
import com.capstone.rebyu.accountdeletion.entity.AccountDeletionRequest.Kind;
import com.capstone.rebyu.accountdeletion.entity.AccountDeletionRequest.Status;
import com.capstone.rebyu.accountdeletion.repository.AccountDeletionRequestRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.institution.service.InstitutionService;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.repository.UserRepository;
import com.capstone.rebyu.user.service.AccountDeletionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Learners, department heads and institutions ask for their account to be deleted; an admin
 * approves (the real, cascading delete runs) or declines. A user has at most one pending request.
 *
 * <p>Approving an INSTITUTION request deletes the institution with everything under it, then the
 * account of every owner and department head who belonged to it and to no other institution.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionRequestService {

    private static final int MAX_TEXT = 1000;

    private final AccountDeletionRequestRepository requests;
    private final AccountDeletionService accountDeletion;
    private final InstitutionService institutions;
    private final InstitutionRepository institutionRepository;
    private final DepartmentHeadRepository departmentHeads;
    private final UserRepository users;
    private final NotificationService notifications;

    public record RequestDto(
            Long requestId,
            String kind,
            String status,
            String email,
            String displayName,
            String institutionName,
            Long institutionId,
            String reason,
            String adminNote,
            Instant requestedAt,
            Instant reviewedAt,
            boolean accountExists) {
    }

    // ----- the account holder -----

    /** The caller's latest request (pending or decided), or null when they never asked. */
    @Transactional(readOnly = true)
    public RequestDto mine(CurrentUserDto user) {
        return requests.findFirstByUserIdOrderByRequestedAtDesc(user.userId())
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional
    public RequestDto submit(CurrentUserDto user, String reason) {
        Kind kind = kindOf(user);
        if (requests.findFirstByUserIdAndStatus(user.userId(), Status.PENDING).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have a deletion request waiting for review.");
        }
        Long institutionId = kind == Kind.INSTITUTION ? user.institutionId() : null;
        String institutionName = user.institutionId() == null ? null
                : institutionRepository.findById(user.institutionId())
                        .map(Institution::getInstitutionName).orElse(null);

        AccountDeletionRequest saved = requests.save(AccountDeletionRequest.builder()
                .userId(user.userId())
                .institutionId(institutionId)
                .kind(kind)
                .email(user.email())
                .displayName(user.displayName())
                .institutionName(institutionName)
                .reason(trim(reason))
                .status(Status.PENDING)
                .requestedAt(Instant.now())
                .build());

        String who = kind == Kind.INSTITUTION && institutionName != null
                ? institutionName + " (" + user.email() + ")"
                : user.email();
        for (var admin : users.findByUserType_UserTypeText("ADMIN")) {
            notifications.notify(admin, "Account deletion requested",
                    who + " asked for their " + label(kind) + " to be deleted.",
                    "/admin/deletion-requests");
        }
        log.info("Account deletion requested: user {} ({}), request {}",
                user.userId(), kind, saved.getRequestId());
        return toDto(saved);
    }

    @Transactional
    public RequestDto cancel(CurrentUserDto user) {
        AccountDeletionRequest request = requests.findFirstByUserIdAndStatus(user.userId(), Status.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "There is no pending deletion request to cancel."));
        request.setStatus(Status.CANCELLED);
        request.setReviewedAt(Instant.now());
        return toDto(requests.save(request));
    }

    // ----- admin -----

    @Transactional(readOnly = true)
    public List<RequestDto> listForAdmin(boolean pendingOnly) {
        List<AccountDeletionRequest> rows = pendingOnly
                ? requests.findByStatusOrderByRequestedAtAsc(Status.PENDING)
                : requests.findAllByOrderByRequestedAtDesc();
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional
    public RequestDto approve(Long requestId, Long adminUserId, String note) {
        AccountDeletionRequest request = pending(requestId);
        if (adminUserId != null && adminUserId.equals(request.getUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot approve your own deletion.");
        }

        if (request.getKind() == Kind.INSTITUTION && request.getInstitutionId() != null
                && institutionRepository.existsById(request.getInstitutionId())) {
            deleteInstitution(request);
        } else if (request.getUserId() != null && users.existsById(request.getUserId())) {
            accountDeletion.deleteUser(request.getUserId());
        }

        // The account is gone; the row stays as the record of who asked and who approved.
        request.setUserId(null);
        request.setStatus(Status.APPROVED);
        request.setReviewedByUserId(adminUserId);
        request.setReviewedAt(Instant.now());
        request.setAdminNote(trim(note));
        log.info("Account deletion request {} approved by admin {}: {} {} deleted",
                requestId, adminUserId, request.getKind(), request.getEmail());
        return toDto(requests.save(request));
    }

    @Transactional
    public RequestDto decline(Long requestId, Long adminUserId, String note) {
        AccountDeletionRequest request = pending(requestId);
        request.setStatus(Status.DECLINED);
        request.setReviewedByUserId(adminUserId);
        request.setReviewedAt(Instant.now());
        request.setAdminNote(trim(note));
        if (request.getUserId() != null) {
            users.findById(request.getUserId()).ifPresent(user -> notifications.notify(user,
                    "Account deletion request declined",
                    request.getAdminNote() == null
                            ? "Your request to delete your account was declined. Contact support for details."
                            : "Your request to delete your account was declined: " + request.getAdminNote(),
                    null));
        }
        return toDto(requests.save(request));
    }

    private void deleteInstitution(AccountDeletionRequest request) {
        Long institutionId = request.getInstitutionId();
        Set<Long> memberUserIds = new LinkedHashSet<>();
        if (request.getUserId() != null) memberUserIds.add(request.getUserId());
        for (DepartmentHead head : departmentHeads.findByInstitution_InstitutionId(institutionId)) {
            memberUserIds.add(head.getUser().getUserId());
        }

        institutions.delete(institutionId);

        for (Long userId : memberUserIds) {
            // Someone who also belongs to another institution keeps their account.
            if (!users.existsById(userId) || !departmentHeads.findByUser_UserId(userId).isEmpty()) {
                continue;
            }
            accountDeletion.deleteUser(userId);
        }
    }

    private AccountDeletionRequest pending(Long requestId) {
        AccountDeletionRequest request = requests.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found."));
        if (request.getStatus() != Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This request was already " + request.getStatus().name().toLowerCase(Locale.ROOT) + ".");
        }
        return request;
    }

    private static Kind kindOf(CurrentUserDto user) {
        String role = user.role() == null ? "" : user.role().trim().toUpperCase(Locale.ROOT);
        if (CognitoAuthService.LEARNER_USER_TYPE.equals(role)) return Kind.LEARNER;
        if (CognitoAuthService.DEPARTMENT_HEAD_USER_TYPE.equals(role)) return Kind.DEPARTMENT_HEAD;
        if (CognitoAuthService.INSTITUTION_USER_TYPE.equals(role)) {
            // Same owner test as the frontend's isInstitutionOwner: no membership role, or "owner".
            boolean owner = user.departmentHeadRole() == null
                    || "owner".equalsIgnoreCase(user.departmentHeadRole());
            return owner && user.institutionId() != null ? Kind.INSTITUTION : Kind.DEPARTMENT_HEAD;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Administrator accounts cannot be deleted through a request.");
    }

    private static String label(Kind kind) {
        return switch (kind) {
            case LEARNER -> "learner account";
            case DEPARTMENT_HEAD -> "department head account";
            case INSTITUTION -> "institution account";
        };
    }

    private static String trim(String text) {
        if (text == null || text.isBlank()) return null;
        String t = text.trim();
        return t.length() > MAX_TEXT ? t.substring(0, MAX_TEXT) : t;
    }

    private RequestDto toDto(AccountDeletionRequest r) {
        boolean exists = r.getUserId() != null && users.existsById(r.getUserId());
        return new RequestDto(r.getRequestId(), r.getKind().name(), r.getStatus().name(), r.getEmail(),
                r.getDisplayName(), r.getInstitutionName(), r.getInstitutionId(), r.getReason(),
                r.getAdminNote(), r.getRequestedAt(), r.getReviewedAt(), exists);
    }
}
