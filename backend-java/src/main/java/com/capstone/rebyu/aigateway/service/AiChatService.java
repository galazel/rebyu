package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.dto.AppendConversationRequest;
import com.capstone.rebyu.aigateway.dto.ChatRequest;
import com.capstone.rebyu.aigateway.dto.ChatResponse;
import com.capstone.rebyu.aigateway.dto.ConversationResponseDto;
import com.capstone.rebyu.learningtools.service.TutorLibraryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiServiceClient aiServiceClient;
    private final TutorLibraryService tutorLibrary;
    private final com.capstone.rebyu.billing.service.AiGenerationQuotaService generationQuota;
    private final ObjectMapper objectMapper;

    public ChatResponse chat(ChatRequest request) {
        ChatResponse response = aiServiceClient.chat(request);
        if (response == null || response.getReply() == null || response.getReply().isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY, "The AI tutor returned no answer. Your allowance was not charged.");
        }
        return response;
    }

    public SseEmitter streamChat(ChatRequest request, Long learnerId) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        Long reservation = learnerId == null ? null : generationQuota.reserveTutor(learnerId, com.capstone.rebyu.billing.service.AiGenerationQuotaService.KIND_TUTOR_CHAT);
        var settled = new AtomicBoolean();
        var hasOutput = new AtomicBoolean();
        var done = new AtomicBoolean();
        Set<String> tools = ConcurrentHashMap.newKeySet();
        Runnable fail = () -> {
            if (reservation != null && settled.compareAndSet(false, true)) generationQuota.settleTutor(learnerId, reservation, false);
        };
        emitter.onCompletion(fail);
        emitter.onTimeout(() -> { fail.run(); emitter.complete(); });
        emitter.onError(error -> fail.run());
        try {
        Disposable subscription = aiServiceClient.streamChat(request)
                // Saving to the Library touches the database: off the event loop.
                .publishOn(Schedulers.boundedElastic())
                .map(event -> saveToLibrary(event, request, learnerId))
                .subscribe(event -> {
                    try {
                        var payload = event.data() == null ? null : objectMapper.readTree(event.data());
                        String type = payload == null ? event.event() : payload.path("type").asText(event.event());
                        if ("error".equals(type)) fail.run();
                        if ("done".equals(type)) done.set(true);
                        if (("delta".equals(type) || "replace".equals(type)) && !payload.path("text").asText("").isBlank()) hasOutput.set(true);
                        if ("widget".equals(type) && payload.path("widget").isObject() && !payload.path("widget").path("type").asText("").isBlank()) {
                            hasOutput.set(true); tools.add(payload.path("widget").path("type").asText());
                        }
                    } catch (Exception invalidEvent) { /* Invalid/heartbeat events cannot establish delivery. */ }
                    if (!forward(emitter, event)) fail.run();
                },
                error -> {
                    fail.run();
                    log.warn("Tutor stream for {} failed: {}", request.getSessionId(), error.toString());
                    emitter.completeWithError(error);
                },
                () -> {
                    if (reservation != null && settled.compareAndSet(false, true)) {
                        boolean success = done.get() && hasOutput.get();
                        generationQuota.settleTutor(learnerId, reservation, success);
                        if (success) tools.forEach(type -> generationQuota.recordTool(learnerId, type));
                    }
                    emitter.complete();
                });
        emitter.onCompletion(subscription::dispose);
        emitter.onTimeout(() -> {
            fail.run();
            subscription.dispose();
            emitter.complete();
        });
        emitter.onError(e -> { fail.run(); subscription.dispose(); });
        return emitter;
        } catch (RuntimeException failure) {
            fail.run();
            throw failure;
        }
    }

    /**
     * A quiz, flashcard set or mind map the tutor drew is saved to the learner's
     * Library as it passes through, like the old Generate buttons did; the event
     * goes on carrying `library` {id, title, route} so the chat can link to it.
     */
    private ServerSentEvent<String> saveToLibrary(ServerSentEvent<String> event, ChatRequest request, Long learnerId) {
        if (learnerId == null || !"widget".equals(event.event()) || event.data() == null) return event;
        try {
            ObjectNode payload = (ObjectNode) objectMapper.readTree(event.data());
            if (!(payload.get("widget") instanceof ObjectNode widget)) return event;
            // Usage-tool notes are committed only after the entire stream succeeds.
            if (!TutorLibraryService.isSaveable(widget.path("type").asText())) return event;
            TutorLibraryService.Saved saved = tutorLibrary.save(learnerId, request.getLessonId(), request.getLessonName(), widget);
            if (saved == null) return event;
            widget.set("library", objectMapper.valueToTree(saved));
            return ServerSentEvent.<String>builder(objectMapper.writeValueAsString(payload)).event(event.event()).build();
        } catch (Exception e) {
            log.warn("Could not save a tutor widget for {}: {}", request.getSessionId(), e.toString());
            return event;
        }
    }

    private static final long STREAM_TIMEOUT_MS = 3 * 60 * 1000L;

    private boolean forward(SseEmitter emitter, ServerSentEvent<String> event) {
        try {
            SseEmitter.SseEventBuilder out = SseEmitter.event();
            if (event.event() != null) {
                out.name(event.event());
            }
            if (event.data() != null) {
                out.data(event.data());
            }
            emitter.send(out);
            return true;
        } catch (IOException | IllegalStateException e) {
            log.debug("Tutor stream client went away: {}", e.toString());
            emitter.complete();
            return false;
        }
    }

    public java.util.Map<String, Object> listConversations(String baseSessionId) {
        return aiServiceClient.listConversations(baseSessionId);
    }

    public ConversationResponseDto getConversation(String sessionId) {
        return aiServiceClient.getConversation(sessionId);
    }

    public ConversationResponseDto appendConversation(AppendConversationRequest request) {
        return aiServiceClient.appendConversation(request);
    }
}
