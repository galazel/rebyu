package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.dto.AppendConversationRequest;
import com.capstone.rebyu.aigateway.dto.ChatRequest;
import com.capstone.rebyu.aigateway.dto.ChatResponse;
import com.capstone.rebyu.aigateway.dto.ConversationResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

import java.io.IOException;

/** Thin trigger: tutor chat is generated entirely by the Python AI backend. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiServiceClient aiServiceClient;

    public ChatResponse chat(ChatRequest request) {
        return aiServiceClient.chat(request);
    }

    /**
     * Relays the tutor's streamed answer to the browser, event for event. The
     * upstream stream is cancelled when the browser goes away, times out, or
     * errors, so an abandoned tab does not keep a model generating.
     */
    public SseEmitter streamChat(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        Disposable subscription = aiServiceClient.streamChat(request).subscribe(
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
            // The learner closed the tab or the panel: completing disposes the
            // upstream subscription (see onCompletion above).
            log.debug("Tutor stream client went away: {}", e.toString());
            emitter.complete();
        }
    }

    public ConversationResponseDto getConversation(String sessionId) {
        return aiServiceClient.getConversation(sessionId);
    }

    public ConversationResponseDto appendConversation(AppendConversationRequest request) {
        return aiServiceClient.appendConversation(request);
    }
}
