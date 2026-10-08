package com.capstone.rebyu.user.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.progress.analytics.dto.CertificationProgressDto;
import com.capstone.rebyu.user.dto.LearnerDto;
import com.capstone.rebyu.user.dto.LearnerPortalDto;
import com.capstone.rebyu.user.service.LearnerPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learners/me")
@RequiredArgsConstructor
public class LearnerPortalController {

    private final LearnerPortalService portalService;
    private final CognitoAuthService auth;

    @GetMapping("/portal")
    public LearnerPortalDto portal(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "true") boolean includeProgress) {
        CurrentUserDto me = requireLearner(jwt);
        return portalService.portal(me.learnerId(), me.userId(), includeProgress);
    }

    @GetMapping("/certification-progress")
    public List<CertificationProgressDto> certificationProgress(@AuthenticationPrincipal Jwt jwt) {
        CurrentUserDto me = requireLearner(jwt);
        return portalService.certificationProgress(me.learnerId(), me.userId());
    }

    @GetMapping
    public LearnerDto me(@AuthenticationPrincipal Jwt jwt) {
        return portalService.currentLearner(requireLearner(jwt).learnerId());
    }

    private CurrentUserDto requireLearner(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) {
            throw new IllegalArgumentException("A learner account is required");
        }
        return user;
    }
}
