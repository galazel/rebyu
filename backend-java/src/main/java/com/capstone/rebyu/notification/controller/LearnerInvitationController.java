package com.capstone.rebyu.notification.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.notification.dto.LearnerInvitationDto;
import com.capstone.rebyu.notification.service.LearnerInvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Invitations to join a certification.
 *
 * <p>Read-only: the write endpoints were removed because they let anyone forge
 * a valid, self-computed invitation token for any certification with no auth
 * check. The real sending flow lives in InstitutionInvitationService.
 *
 * <p>{@link #getAll} is every invitation on the platform, and it had no
 * authorization at all. The learner shell called it every thirty seconds and
 * kept the rows whose email matched its own, so each learner's browser was
 * handed every other learner's name, email address, invitation status and
 * inviting institution -- a cross-tenant leak performed by the client on the
 * server's behalf, which is the same defect recorded for the other global
 * lists. Filtering in the browser is not filtering.
 *
 * <p>{@link #getMine} now answers that need from the token, so the shell asks
 * only for what it may see, and the unfiltered list is admin-only.
 */
@RestController
@RequestMapping("/api/learner-invitations")
@RequiredArgsConstructor
public class LearnerInvitationController {
    private final LearnerInvitationService learnerInvitationService;
    private final RoleGuard guard;

    /** The signed-in caller's own pending invitations, resolved from their token. */
    @GetMapping("/me")
    public List<LearnerInvitationDto> getMine(@AuthenticationPrincipal Jwt jwt) {
        CurrentUserDto user = guard.requireAuthenticated(jwt);
        return learnerInvitationService.getMyPending(user.email());
    }

    @GetMapping
    public List<LearnerInvitationDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return learnerInvitationService.getAll();
    }

    @GetMapping("/{id}")
    public LearnerInvitationDto getById(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        guard.requireAdmin(jwt);
        return learnerInvitationService.getById(id);
    }
}
