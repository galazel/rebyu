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
    private final com.capstone.rebyu.institution.service.DepartmentOverviewService overviewService;
    private final CognitoAuthService auth;

    /** The department head's dashboard for one department, in one response. */
    @GetMapping("/{departmentId}/overview")
    public com.capstone.rebyu.institution.service.DepartmentOverviewService.DepartmentOverview overview(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId) {
        CurrentUserDto user = requireInstitution(jwt);
        return overviewService.overview(departmentId, user.institutionId(), user.userId(), isOwner(user));
    }

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

    /** Cheating signals on the learner's assessments: tab exits, blocked copy/paste, forfeits. */
    @GetMapping("/{departmentId}/learners/{learnerId}/integrity")
    public InstitutionLearnerInsightsService.LearnerIntegrity integrity(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long learnerId) {
        CurrentUserDto user = requireInstitution(jwt);
        return insightsService.learnerIntegrity(
                departmentId, learnerId, user.institutionId(), user.userId(), isOwner(user));
    }

    /** AI tutor safety alerts for this learner: self-harm, abuse, threats, data probes. */
    @GetMapping("/{departmentId}/learners/{learnerId}/safety-alerts")
    public List<InstitutionLearnerInsightsService.SafetyAlertRow> safetyAlerts(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long learnerId) {
        CurrentUserDto user = requireInstitution(jwt);
        return insightsService.learnerSafetyAlerts(
                departmentId, learnerId, user.institutionId(), user.userId(), isOwner(user));
    }

    /** Marks a safety alert as reviewed (the head has followed up), with an optional note. */
    @org.springframework.web.bind.annotation.PostMapping("/{departmentId}/learners/{learnerId}/safety-alerts/{alertId}/review")
    public InstitutionLearnerInsightsService.SafetyAlertRow reviewSafetyAlert(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long learnerId,
            @PathVariable Long alertId,
            @org.springframework.web.bind.annotation.RequestBody(required = false) java.util.Map<String, String> body) {
        CurrentUserDto user = requireInstitution(jwt);
        return insightsService.reviewSafetyAlert(departmentId, learnerId, alertId,
                body == null ? null : body.get("note"),
                user.institutionId(), user.userId(), isOwner(user));
    }

    @GetMapping("/{departmentId}/assessments/{examId}/results")
    public InstitutionLearnerInsightsService.AssessmentResults assessmentResults(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long examId) {
        CurrentUserDto user = requireInstitution(jwt);
        return insightsService.assessmentResults(
                departmentId, examId, user.institutionId(), user.userId(), isOwner(user));
    }

    @GetMapping("/{departmentId}/learners/{learnerId}/attempts/{attemptId}/result")
    public com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AssessmentAttemptResultDto memberAttemptResult(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long learnerId,
            @PathVariable Long attemptId) {
        CurrentUserDto user = requireInstitution(jwt);
        return insightsService.memberAttemptResult(
                departmentId, learnerId, attemptId, user.institutionId(), user.userId(), isOwner(user));
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
