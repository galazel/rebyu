package com.capstone.rebyu.institution.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.institution.service.InstitutionLearnerInsightsService;
import com.capstone.rebyu.institution.service.InstitutionLearnerInsightsService.DepartmentLearnerRow;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.ProgressAnalyticsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/institution/me/departments")
@RequiredArgsConstructor
public class InstitutionLearnerInsightsController {

    private final InstitutionLearnerInsightsService insightsService;
    private final CognitoAuthService auth;

    @GetMapping("/{departmentId}/learners")
    public List<DepartmentLearnerRow> roster(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId) {
        CurrentUserDto user = requireInstitution(jwt);
        return insightsService.groupRoster(
                departmentId, user.institutionId(), user.userId(), isOwner(user));
    }

    @GetMapping("/{departmentId}/learners/{learnerId}/analytics")
    public ProgressAnalyticsResponse analytics(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long learnerId) {
        CurrentUserDto user = requireInstitution(jwt);
        return insightsService.learnerAnalytics(
                departmentId, learnerId, user.institutionId(), user.userId(), isOwner(user));
    }

    @DeleteMapping("/{departmentId}/learners/{learnerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFromGroup(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long learnerId) {
        CurrentUserDto user = requireInstitution(jwt);
        insightsService.removeFromGroup(
                departmentId, learnerId, user.institutionId(), user.userId(), isOwner(user));
    }

    private CurrentUserDto requireInstitution(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        return user;
    }

    private boolean isOwner(CurrentUserDto user) {
        return "owner".equalsIgnoreCase(user.departmentHeadRole());
    }
}
