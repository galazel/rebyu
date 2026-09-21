package com.capstone.rebyu.enrollment.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.enrollment.service.CertificationAwardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The badges and certificates the signed-in learner has earned. */
@RestController
@RequestMapping("/api/learners/me/awards")
@RequiredArgsConstructor
public class LearnerAwardController {

    private final CognitoAuthService auth;
    private final CertificationAwardService awardService;
    private final CertificationRepository certificationRepository;

    @GetMapping
    public List<CertificationAwardService.AwardDto> mine(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) return List.of();
        return awardService.awardsOf(user.learnerId(), id -> certificationRepository.findById(id).orElse(null));
    }
}
