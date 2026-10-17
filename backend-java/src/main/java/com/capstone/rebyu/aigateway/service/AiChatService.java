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

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiServiceClient aiServiceClient;
    private final TutorLibraryService tutorLibrary;
    private final com.capstone.rebyu.billing.service.AiGenerationQuotaService generationQuota;
    private final ObjectMapper objectMapper;

    public ChatResponse chat(ChatRequest request) {
        return aiServiceClient.chat(request);
    }

    public SseEmitter streamChat(ChatRequest request, Long learnerId) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        Disposable subscription = aiServiceClient.streamChat(request)
                // Saving to the Library touches the database: off the event loop.
                .publishOn(Schedulers.boundedElastic())
                .map(event -> saveToLibrary(event, request, learnerId))
                .subscribe(
                event -> forward(emitter, event),
                error -> {
                    log.warn("Tutor stream for {} failed: {}", request.getSessionId(), error.toString());
                    emitter.completeWithError(error);
                },
                emitter::complete);
        emitter.onCompletion(subscription::dispose);
        emitter.onTimeout(() -> {
            subscription.dispose();
            emitter.complete();
        });
        emitter.onError(e -> subscription.dispose());
        return emitter;
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
            // Noted for the usage breakdown; not counted toward the limit.
            generationQuota.recordTool(learnerId, widget.path("type").asText());
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

    private void forward(SseEmitter emitter, ServerSentEvent<String> event) {
        try {
            SseEmitter.SseEventBuilder out = SseEmitter.event();
            if (event.event() != null) {
                out.name(event.event());
            }
            if (event.data() != null) {
                out.data(event.data());
            }
            emitter.send(out);
        } catch (IOException | IllegalStateException e) {
            log.debug("Tutor stream client went away: {}", e.toString());
            emitter.complete();
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
