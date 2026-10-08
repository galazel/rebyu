package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.client.WorkflowClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowStreamRelayService {

    private static final long STREAM_TIMEOUT_MS = 30 * 60 * 1000L;

    private final WorkflowClient workflowClient;

    public SseEmitter relay(String runId, String lastEventId) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);

        Disposable subscription = workflowClient.streamTimeline(runId, lastEventId)
                .subscribe(
                        event -> forward(emitter, runId, event),
                        error -> {
                            log.warn("Workflow stream {} failed: {}", runId, error.toString());
                            emitter.completeWithError(error);
                        },
                        emitter::complete
                );

        emitter.onCompletion(subscription::dispose);
        emitter.onTimeout(() -> {
            subscription.dispose();
            emitter.complete();
        });
        emitter.onError(e -> subscription.dispose());

        return emitter;
    }

    private void forward(SseEmitter emitter, String runId, org.springframework.http.codec.ServerSentEvent<String> event) {
        try {
            SseEmitter.SseEventBuilder out = SseEmitter.event();
            if (event.event() != null) {
                out.name(event.event());
            }
            if (event.id() != null) {
                out.id(event.id());
            }
            if (event.data() != null) {
                out.data(event.data());
            }
            emitter.send(out);
        } catch (IOException e) {
            log.debug("Client disconnected from workflow stream {}: {}", runId, e.toString());
            emitter.complete();
        } catch (IllegalStateException e) {
            log.warn("Workflow stream {} could not be written: {}", runId, e.toString());
            emitter.complete();
        }
    }
}
