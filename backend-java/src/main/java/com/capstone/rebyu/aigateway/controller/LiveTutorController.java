package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.aigateway.service.LiveTeachingService;
import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import com.capstone.rebyu.billing.service.LiveTutorQuotaService;
import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.List;
import java.util.UUID;

/** Mints a short-lived Live Tutor connection without exposing the API key. */
@RestController
@RequestMapping("/api/ai/tutor/live")
@RequiredArgsConstructor
public class LiveTutorController {

    private final CognitoAuthService auth;
    private final LearnerEntitlementService entitlements;
    private final LiveTeachingService teaching;
    private final ElevenLabsSettingsService provider;
    private final LiveTutorQuotaService quota;
    private final AiServiceClient ai;

    public record TurnRequest(UUID connectionId, Long sequence, String action, Boolean active, String message) {}
    private static final java.util.Set<String> TURN_ACTIONS = java.util.Set.of("open", "typing", "submit", "continue", "agent_message", "pause", "resume", "close");

    @PostMapping("/sessions/{id}/turn")
    public Map<String, Object> coordinate(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody TurnRequest request) {
        var user = requireTutor(jwt);
        teaching.requireOwner(user, id);
        if (request == null || request.connectionId() == null || request.sequence() == null || request.sequence() < 1 || request.sequence() > 1000000
                || request.action() == null || !TURN_ACTIONS.contains(request.action())
                || ("typing".equals(request.action()) && request.active() == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Live Tutor activity event.");
        }
        boolean submitted = java.util.Set.of("submit", "agent_message").contains(request.action());
        if ((submitted && (request.message() == null || request.message().isBlank() || request.message().length() > 3000))
                || (!submitted && request.message() != null)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only submitted messages may include text.");
        var body = new java.util.LinkedHashMap<String, Object>();
        body.put("ownerId", user.userId()); body.put("sessionId", id); body.put("connectionId", request.connectionId());
        body.put("sequence", request.sequence()); body.put("action", request.action());
        if (request.active() != null) body.put("active", request.active());
        if (submitted) body.put("message", request.message());
        return ai.liveTutorTurn(body);
    }

    public record StartSessionRequest(Long lessonId, String lessonName) {}

    @PostMapping("/session")
    public Map<String, Object> startSession(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) StartSessionRequest request) {
        CurrentUserDto user = requireTutor(jwt);
        if (request == null || request.lessonId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A lesson ID is required.");
        }
        Map<String, Object> teachingSession = teaching.initialize(user, request.lessonId());

        try {
            var connection = quota.authorize("ADMIN".equalsIgnoreCase(user.role()) ? null : user.learnerId(), provider::signedUrl);
            teachingSession.put("signedUrl", connection.signedUrl());
            teachingSession.put("usageId", connection.usageId());
            teachingSession.put("agentId", provider.agentId());
            return teachingSession;
        } catch (ResponseStatusException | com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not start the Live Tutor voice connection.", exception);
        }
    }

    public record TeachingEvent(String type, String state, Map<String, Object> context, List<Map<String, String>> transcript) {}

    @PostMapping("/sessions/{id}/usage/{usageId}")
    public Map<String, Object> reconcileUsage(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @PathVariable Long usageId) {
        var user = requireTutor(jwt);
        teaching.requireOwner(user, id);
        if ("ADMIN".equalsIgnoreCase(user.role())) return Map.of("status", "preview", "charged", false);
        return quota.reconcile(user.learnerId(), usageId);
    }

    @PostMapping("/sessions/{id}/events")
    public Map<String, Object> event(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody TeachingEvent event) {
        return teaching.save(requireTutor(jwt), id, event.type(), event.state(), event.context(), event.transcript());
    }

    private CurrentUserDto requireTutor(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() != null && !"ADMIN".equalsIgnoreCase(user.role())) {
            entitlements.requireLearnerEntitlement(user.learnerId(), Entitlements.AI_TUTOR, null);
        }
        return user;
    }
}
