package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.entity.LessonDialogueSession;
import com.capstone.rebyu.aigateway.repository.LessonDialogueSessionRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The tutor's guided Dialogue. Python runs each turn statelessly; this side checks
 * the tutor entitlement and records the learner's completion when a summary is made.
 */
@RestController
@RequestMapping("/api/ai/tutor/dialogue")
@RequiredArgsConstructor
public class TutorDialogueController {

    private static final Set<String> ACTIONS = Set.of("start", "reply", "summary");
    private static final int MAX_HISTORY = 40;

    private final AiServiceClient aiServiceClient;
    private final CognitoAuthService auth;
    private final LearnerEntitlementService entitlements;
    private final LessonDialogueSessionRepository sessions;

    public record TurnRequest(String action, Long lessonId, String lessonName,
                              List<String> topics, List<Map<String, Object>> history, List<String> avoid) {}

    @PostMapping
    public Map<String, Object> turn(@AuthenticationPrincipal Jwt jwt, @RequestBody TurnRequest request) {
        CurrentUserDto user = requireTutor(jwt);
        if (request.action() == null || !ACTIONS.contains(request.action())) {
            throw new IllegalArgumentException("Unknown dialogue action");
        }
        List<Map<String, Object>> history = request.history() == null ? List.of() : request.history();
        if (history.size() > MAX_HISTORY) {
            history = history.subList(history.size() - MAX_HISTORY, history.size());
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("action", request.action());
        body.put("lessonId", request.lessonId());
        body.put("lessonName", request.lessonName() == null ? "" : request.lessonName());
        body.put("topics", request.topics() == null ? List.of() : request.topics());
        body.put("history", history);
        body.put("avoid", request.avoid() == null ? List.of() : request.avoid().stream().limit(30).toList());

        Map<String, Object> result = aiServiceClient.tutorDialogue(body);

        if ("summary".equals(request.action()) && result != null && result.get("summary") instanceof Map<?, ?> summary
                && user.learnerId() != null && request.lessonId() != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> typed = (Map<String, Object>) summary;
            Map<String, Object> saved = new LinkedHashMap<>(result);
            LessonDialogueSession session = sessions.save(LessonDialogueSession.builder()
                    .learnerId(user.learnerId())
                    .lessonId(request.lessonId())
                    .topics(request.topics() == null ? List.of() : request.topics())
                    .history(history)
                    .summary(typed)
                    .completedAt(LocalDateTime.now())
                    .build());
            saved.put("sessionId", session.getSessionId());
            saved.put("completedAt", session.getCompletedAt());
            return saved;
        }
        return result;
    }

    @GetMapping("/status")
    public Map<String, Object> status(@AuthenticationPrincipal Jwt jwt, @RequestParam Long lessonId) {
        CurrentUserDto user = requireTutor(jwt);
        Map<String, Object> status = new LinkedHashMap<>();
        List<Map<String, Object>> past = user.learnerId() == null ? List.of()
                : sessions.findTop20ByLearnerIdAndLessonIdOrderByCompletedAtDesc(user.learnerId(), lessonId)
                        .stream().map(TutorDialogueController::view).toList();
        status.put("completed", !past.isEmpty());
        status.put("sessions", past);
        return status;
    }

    private static Map<String, Object> view(LessonDialogueSession session) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("sessionId", session.getSessionId());
        view.put("completedAt", session.getCompletedAt());
        view.put("topics", session.getTopics());
        view.put("history", session.getHistory());
        view.put("summary", session.getSummary());
        return view;
    }

    private CurrentUserDto requireTutor(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() != null && !"ADMIN".equalsIgnoreCase(user.role())) {
            entitlements.requireLearnerEntitlement(user.learnerId(), Entitlements.AI_TUTOR, null);
        }
        return user;
    }
}
