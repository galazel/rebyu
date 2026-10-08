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

@RestController
@RequestMapping("/api/learner-invitations")
@RequiredArgsConstructor
public class LearnerInvitationController {
    private final LearnerInvitationService learnerInvitationService;
    private final RoleGuard guard;

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
