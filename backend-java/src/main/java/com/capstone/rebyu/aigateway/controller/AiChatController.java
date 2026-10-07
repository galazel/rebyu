package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.dto.AppendConversationRequest;
import com.capstone.rebyu.aigateway.dto.ChatRequest;
import com.capstone.rebyu.aigateway.dto.ChatResponse;
import com.capstone.rebyu.aigateway.dto.ConversationResponseDto;
import com.capstone.rebyu.aigateway.service.AiChatService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final CognitoAuthService auth;
    private final LearnerEntitlementService entitlements;

    /** The tutor is REBYU Pro. Staff (admin, institution) keep it for previewing lessons. */
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

    /**
     * The tutor and the caller, for a conversation the caller owns. Sessions
     * are "{learnerId}-{lessonId}" (staff previewing use "guest-{lessonId}"),
     * and the id comes from the browser -- without this, any Pro learner could
     * read or write another learner's tutor conversation by changing the number.
     */
    private void requireTutorSession(Jwt jwt, String sessionId) {
        CurrentUserDto user = requireTutor(jwt);
        if ("ADMIN".equalsIgnoreCase(user.role())) {
            return;
        }
        String prefix = (user.learnerId() != null ? user.learnerId().toString() : "guest") + "-";
        if (sessionId == null || !sessionId.startsWith(prefix)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This tutor conversation belongs to someone else.");
        }
    }

    @PostMapping("/tutor")
    public ChatResponse chat(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChatRequest request) {
        requireTutorSession(jwt, request.getSessionId());
        return aiChatService.chat(request);
    }

    /** The answer as it is written, as Server-Sent Events relayed from the AI service. */
    @PostMapping(value = "/tutor/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChatRequest request) {
        requireTutorSession(jwt, request.getSessionId());
        return aiChatService.streamChat(request);
    }

    @GetMapping("/tutor/conversation")
    public ConversationResponseDto getConversation(@AuthenticationPrincipal Jwt jwt, @RequestParam String sessionId) {
        requireTutorSession(jwt, sessionId);
        return aiChatService.getConversation(sessionId);
    }

    /** Records a turn the model didn't produce (a generated quiz/flashcard set). */
    @PostMapping("/tutor/conversation/messages")
    public ConversationResponseDto appendConversation(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AppendConversationRequest request) {
        requireTutorSession(jwt, request.getSessionId());
        return aiChatService.appendConversation(request);
    }
}
