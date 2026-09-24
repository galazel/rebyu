package com.capstone.rebyu.adaptive.controller;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.service.AdaptivePolicy;
import com.capstone.rebyu.adaptive.service.QuestionBankSizeService;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Admin view of the adaptive engine: how big an assessment's bank is, what
 * the engine currently believes about a question, and the trigger for the
 * calibration job that re-fits item parameters from real responses.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/adaptive")
@RequiredArgsConstructor
public class AdaptiveAdminController {

    private final CognitoAuthService auth;
    private final ExamRepository exams;
    private final QuestionBankSizeService bankSize;
    private final AdaptivePolicy policy;
    private final AdaptiveProperties properties;

    public record BankSizeDto(Long examId, String examType, boolean adaptive, int itemCount, int finalRoundMax,
                              int total, int main, int workspace, int required, int requiredMain, boolean sufficient) {
    }

    @GetMapping("/bank-size/{examId}")
    @Transactional(readOnly = true)
    public BankSizeDto bankSize(@AuthenticationPrincipal Jwt jwt, @PathVariable Long examId) {
        requireAdmin(jwt);
        Exam exam = exams.findById(examId)
                .orElseThrow(() -> new EntityNotFoundException("Assessment not found: " + examId));
        String type = exam.getExamType().getExamTypeText();
        QuestionBankSizeService.BankSize size = bankSize.measure(exam);
        return new BankSizeDto(examId, type, policy.isAdaptiveType(type), policy.targetCount(type),
                policy.finalRoundCount(type), size.total(), size.main(), size.workspace(),
                size.required(), size.requiredMain(), size.sufficient());
    }

    private CurrentUserDto requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Admin access is required");
        }
        return user;
    }
}
