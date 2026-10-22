package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.aigateway.service.LiveTeachingService;
import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import com.capstone.rebyu.billing.service.LiveTutorQuotaService;
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
            String value = quota.authorize("ADMIN".equalsIgnoreCase(user.role()) ? null : user.learnerId(), provider::signedUrl);
            teachingSession.put("signedUrl", value);
            teachingSession.put("agentId", provider.agentId());
            return teachingSession;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not start the Live Tutor voice connection.", exception);
        }
    }

    public record TeachingEvent(String type, String state, Map<String, Object> context, List<Map<String, String>> transcript) {}

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
