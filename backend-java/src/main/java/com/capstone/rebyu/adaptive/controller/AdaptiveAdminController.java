package com.capstone.rebyu.adaptive.controller;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.entity.QuestionItemParameter;
import com.capstone.rebyu.adaptive.repository.QuestionItemParameterRepository;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
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
    private final QuestionItemParameterRepository itemParameters;
    private final com.capstone.rebyu.bkt.config.BktProperties bktProperties;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

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
                properties.getFinalRoundMax(), size.total(), size.main(), size.workspace(),
                size.required(), size.requiredMain(), size.sufficient());
    }

    @GetMapping("/items/{questionId}")
    public Map<String, Object> item(@AuthenticationPrincipal Jwt jwt, @PathVariable Long questionId) {
        requireAdmin(jwt);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("questionId", questionId);
        QuestionItemParameter p = itemParameters.findById(questionId).orElse(null);
        out.put("known", p != null);
        if (p != null) {
            out.put("discrimination", p.getDiscrimination());
            out.put("difficulty", p.getDifficulty());
            out.put("guessing", p.getGuessing());
            out.put("responseCount", p.getResponseCount());
            out.put("source", p.getSource());
            out.put("calibratedAt", p.getCalibratedAt());
            out.put("updatedAt", p.getUpdatedAt());
        }
        return out;
    }

    /** Asks the model service to re-fit item parameters from every graded response. */
    @PostMapping("/calibrate")
    public Map<String, Object> calibrate(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return proxy("POST", "/calibrate", "{}");
    }

    @GetMapping("/calibrate/{taskId}")
    public Map<String, Object> calibration(@AuthenticationPrincipal Jwt jwt, @PathVariable String taskId) {
        requireAdmin(jwt);
        return proxy("GET", "/calibrate/" + taskId, null);
    }

    private Map<String, Object> proxy(String method, String path, String body) {
        String base = properties.getIrtServiceUrl().replaceAll("/+$", "");
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(base + path))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json");
            String key = bktProperties.getApiKey();
            if (key != null && !key.isBlank()) builder.header("X-Service-Key", key);
            HttpRequest request = "POST".equals(method)
                    ? builder.POST(HttpRequest.BodyPublishers.ofString(body == null ? "{}" : body)).build()
                    : builder.GET().build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", response.statusCode());
            out.put("body", response.body());
            return out;
        } catch (Exception e) {
            log.warn("Calibration service unreachable: {}", e.getMessage());
            return Map.of("status", 503, "body", "The calibration service is unreachable: " + e.getMessage());
        }
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
