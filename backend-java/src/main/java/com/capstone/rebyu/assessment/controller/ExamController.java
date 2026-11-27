package com.capstone.rebyu.assessment.controller;

import com.capstone.rebyu.assessment.dto.AddExamQuestionsRequest;
import com.capstone.rebyu.assessment.dto.AssessmentDurationsRequest;
import com.capstone.rebyu.assessment.dto.CertificationAssessmentTimers;
import com.capstone.rebyu.assessment.dto.GlobalAssessmentTimers;
import com.capstone.rebyu.assessment.dto.ExamDto;
import com.capstone.rebyu.assessment.service.AssessmentTimerService;
import com.capstone.rebyu.assessment.service.ExamService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;
    private final DepartmentService departmentService;
    private final CognitoAuthService auth;
    private final AssessmentTimerService assessmentTimers;

    @GetMapping
    public List<ExamDto> getAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long includeDepartmentId,
            @RequestParam(required = false) Long certificationId) {
        requireDepartmentAccessIfRequested(jwt, includeDepartmentId);
        return examService.getAll(includeDepartmentId, certificationId, viewerLearnerId(jwt));
    }

    @GetMapping("/{id}")
    public ExamDto getById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long includeDepartmentId) {
        requireDepartmentAccessIfRequested(jwt, includeDepartmentId);
        return examService.getById(id, includeDepartmentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamDto create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExamDto dto,
            @RequestParam(required = false) Long ownerDepartmentId) {
        CurrentUserDto user = requireAdminOrInstitution(jwt);
        boolean isAdmin = isAdmin(user);
        return examService.create(
                dto, isAdmin, user.institutionId(), user.userId(), isOwner(user), ownerDepartmentId);
    }

    @PutMapping("/{id}")
    public ExamDto update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody ExamDto dto) {
        CurrentUserDto user = requireAdminOrInstitution(jwt);
        boolean isAdmin = isAdmin(user);
        return examService.update(id, dto, isAdmin, user.institutionId(), user.userId(), isOwner(user));
    }

    @GetMapping("/timers")
    public GlobalAssessmentTimers getGlobalTimers(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return assessmentTimers.getGlobal();
    }

    @PutMapping("/timers")
    public GlobalAssessmentTimers saveGlobalTimers(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody GlobalAssessmentTimers timers) {
        requireAdmin(jwt);
        return assessmentTimers.saveGlobal(timers);
    }

    @GetMapping("/certification/{certificationId}/timers")
    public CertificationAssessmentTimers getCertificationTimers(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long certificationId) {
        requireAdmin(jwt);
        return assessmentTimers.getCertification(certificationId);
    }

    @PutMapping("/certification/{certificationId}/timers")
    public CertificationAssessmentTimers saveCertificationTimers(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long certificationId,
            @Valid @RequestBody CertificationAssessmentTimers timers) {
        requireAdmin(jwt);
        return assessmentTimers.saveCertification(certificationId, timers);
    }

    private void requireAdmin(Jwt jwt) {
        if (!isAdmin(requireAdminOrInstitution(jwt))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required");
        }
    }

    @PutMapping("/certification/{certificationId}/durations")
    public List<ExamDto> updateAssessmentDurations(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long certificationId,
            @Valid @RequestBody AssessmentDurationsRequest request) {
        CurrentUserDto user = requireAdminOrInstitution(jwt);
        if (!isAdmin(user)) {
            throw new IllegalArgumentException("Admin access is required");
        }
        return examService.updateAssessmentDurations(certificationId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        CurrentUserDto user = requireAdminOrInstitution(jwt);
        boolean isAdmin = isAdmin(user);
        examService.delete(id, isAdmin, user.institutionId(), user.userId(), isOwner(user));
    }

    @PostMapping("/{id}/questions")
    public ExamDto addQuestions(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody AddExamQuestionsRequest request) {
        CurrentUserDto user = requireAdminOrInstitution(jwt);
        boolean isAdmin = isAdmin(user);
        return examService.addQuestions(id, request, isAdmin, user.institutionId(), user.userId(), isOwner(user));
    }

    @PostMapping("/{id}/publish")
    public ExamDto publish(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        CurrentUserDto user = requireAdminOrInstitution(jwt);
        boolean isAdmin = isAdmin(user);
        return examService.publish(id, isAdmin, user.institutionId(), user.userId(), isOwner(user));
    }

    @PostMapping("/{id}/archive")
    public ExamDto archive(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        CurrentUserDto user = requireAdminOrInstitution(jwt);
        boolean isAdmin = isAdmin(user);
        return examService.archive(id, isAdmin, user.institutionId(), user.userId(), isOwner(user));
    }

    private Long viewerLearnerId(Jwt jwt) {
        if (jwt == null) return null;
        try {
            return auth.syncCurrentUser(jwt, jwt.getTokenValue()).learnerId();
        } catch (RuntimeException e) {
            return null;
        }
    }

    private CurrentUserDto requireAdminOrInstitution(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!isAdmin(user) && !CognitoAuthService.isInstitutionRole(user.role())) {
            throw new IllegalArgumentException("Admin or institution access is required");
        }
        return user;
    }

    private void requireDepartmentAccessIfRequested(Jwt jwt, Long includeDepartmentId) {
        if (includeDepartmentId == null) {
            return;
        }
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        boolean owner = "owner".equalsIgnoreCase(user.departmentHeadRole());
        departmentService.getAccessibleById(includeDepartmentId, user.institutionId(), user.userId(), owner);
    }

    private boolean isAdmin(CurrentUserDto user) {
        return "ADMIN".equalsIgnoreCase(user.role());
    }

    private boolean isOwner(CurrentUserDto user) {
        return "owner".equalsIgnoreCase(user.departmentHeadRole());
    }
}
