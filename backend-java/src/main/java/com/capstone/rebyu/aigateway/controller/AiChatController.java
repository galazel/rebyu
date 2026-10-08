package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.TutorSnips;
import com.capstone.rebyu.aigateway.dto.AppendConversationRequest;
import com.capstone.rebyu.aigateway.dto.ChatRequest;
import com.capstone.rebyu.aigateway.dto.ChatResponse;
import com.capstone.rebyu.aigateway.dto.ConversationResponseDto;
import com.capstone.rebyu.aigateway.service.AiChatService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import com.capstone.rebyu.certification.service.S3StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class AiChatController {

    private final AiChatService aiChatService;
    private final CognitoAuthService auth;
    private final LearnerEntitlementService entitlements;
    private final S3StorageService storage;

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

    private CurrentUserDto requireTutorSession(Jwt jwt, String sessionId) {
        CurrentUserDto user = requireTutor(jwt);
        if ("ADMIN".equalsIgnoreCase(user.role())) {
            return user;
        }
        String prefix = (user.learnerId() != null ? user.learnerId().toString() : "guest") + "-";
        if (sessionId == null || !sessionId.startsWith(prefix)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This tutor conversation belongs to someone else.");
        }
        return user;
    }

    private static final int MAX_SNIP_BYTES = 3 * 1024 * 1024;

    private void storeSnip(ChatRequest request, CurrentUserDto user) {
        request.setImageKey(null);
        String image = request.getImage();
        if (image == null || image.isBlank()) {
            return;
        }
        try {
            int comma = image.indexOf(',');
            String type = image.substring("data:".length(), image.indexOf(';'));
            byte[] data = java.util.Base64.getDecoder().decode(image.substring(comma + 1));
            if (data.length > MAX_SNIP_BYTES) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "The snipped picture is too large.");
            }
            String extension = type.endsWith("png") ? "png" : type.endsWith("webp") ? "webp" : "jpg";
            String key = TutorSnips.FOLDER + TutorSnips.ownerOf(user) + "/" + java.util.UUID.randomUUID() + "." + extension;
            storage.uploadBytes(key, data, type);
            request.setImageKey(key);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not store a tutor snip for {}: {}", request.getSessionId(), e.toString());
        }
    }

    @PostMapping("/tutor")
    public ChatResponse chat(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChatRequest request) {
        storeSnip(request, requireTutorSession(jwt, request.getSessionId()));
        return aiChatService.chat(request);
    }

    @PostMapping(value = "/tutor/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChatRequest request) {
        storeSnip(request, requireTutorSession(jwt, request.getSessionId()));
        return aiChatService.streamChat(request);
    }

    @GetMapping("/tutor/conversation")
    public ConversationResponseDto getConversation(@AuthenticationPrincipal Jwt jwt, @RequestParam String sessionId) {
        requireTutorSession(jwt, sessionId);
        return aiChatService.getConversation(sessionId);
    }

    @PostMapping("/tutor/conversation/messages")
    public ConversationResponseDto appendConversation(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AppendConversationRequest request) {
        requireTutorSession(jwt, request.getSessionId());
        if (request.getMessages() != null) {
            request.getMessages().forEach(message -> message.setSnippet(null));
        }
        return aiChatService.appendConversation(request);
    }
}
