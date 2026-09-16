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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final CognitoAuthService auth;
    private final LearnerEntitlementService entitlements;

    /** The tutor is REBYU Pro. Staff (admin, institution) keep it for previewing lessons. */
    private void requireTutor(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() != null && !"ADMIN".equalsIgnoreCase(user.role())) {
            entitlements.requireLearnerEntitlement(user.learnerId(), Entitlements.AI_TUTOR, null);
        }
    }

    @PostMapping("/tutor")
    public ChatResponse chat(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChatRequest request) {
        requireTutor(jwt);
        return aiChatService.chat(request);
    }

    @GetMapping("/tutor/conversation")
    public ConversationResponseDto getConversation(@AuthenticationPrincipal Jwt jwt, @RequestParam String sessionId) {
        requireTutor(jwt);
        return aiChatService.getConversation(sessionId);
    }

    /** Records a turn the model didn't produce (a generated quiz/flashcard set). */
    @PostMapping("/tutor/conversation/messages")
    public ConversationResponseDto appendConversation(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AppendConversationRequest request) {
        requireTutor(jwt);
        return aiChatService.appendConversation(request);
    }
}
