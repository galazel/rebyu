package com.capstone.rebyu.aigateway.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriBuilder;
import reactor.core.publisher.Flux;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class WorkflowClient {

    private final WebClient webClient;

    public WorkflowClient(@Qualifier("aiWebClient") WebClient aiWebClient) {
        this.webClient = aiWebClient;
    }

    public Map<String, Object> listRuns(String status, Long certificationId, int limit, int offset) {
        return get(uri -> {
            uri.path("/workflows").queryParam("limit", limit).queryParam("offset", offset);
            if (StringUtils.hasText(status)) {
                uri.queryParam("status", status);
            }
            if (certificationId != null) {
                uri.queryParam("certification_id", certificationId);
            }
            return uri.build();
        }, "List workflow runs");
    }

    public Map<String, Object> listAwaitingReview(int limit) {
        return get(uri -> uri.path("/workflows/awaiting-review")
                .queryParam("limit", limit)
                .build(), "List runs awaiting review");
    }

    public Map<String, Object> getRun(String runId, long afterSeq) {
        return get(uri -> uri.path("/workflows/{runId}")
                .queryParam("after_seq", afterSeq)
                .build(runId), "Fetch workflow run " + runId);
    }

    public Map<String, Object> getVersions(String runId, String key) {
        return get(uri -> {
            uri.path("/workflows/{runId}/versions");
            if (StringUtils.hasText(key)) {
                uri.queryParam("key", key);
            }
            return uri.build(runId);
        }, "Fetch versions for run " + runId);
    }

    public Map<String, Object> getPendingReview(String runId) {
        return get(uri -> uri.path("/workflows/{runId}/review").build(runId),
                "Fetch pending review for run " + runId);
    }

    public Map<String, Object> cancelRun(String runId) {
        return postToRun("/workflows/{runId}/cancel", runId, "Cancel workflow run ");
    }

    public Map<String, Object> purgeCertification(Long certificationId) {
        try {
            return webClient.delete()
                    .uri(uri -> uri.path("/workflows/certifications/{id}").build(certificationId))
                    .retrieve()
                    .bodyToMono(MAP)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException("Purge AI data for certification " + certificationId + " failed", e);
        }
    }

    public Map<String, Object> retryRun(String runId) {
        return postToRun("/workflows/{runId}/retry", runId, "Retry workflow run ");
    }

    public Map<String, Object> restartRun(String runId) {
        return postToRun("/workflows/{runId}/restart", runId, "Restart workflow run ");
    }

    public Map<String, Object> resumeCertification(String threadId, Map<String, Object> decision) {
        return post("/certification/{threadId}/resume", threadId, decision);
    }

    public Map<String, Object> setCertificationReviewMode(String threadId, Map<String, Object> body) {
        return post("/certification/{threadId}/review-mode", threadId, body);
    }

    public Map<String, Object> reviewQuestionBatch(String threadId, Map<String, Object> decision) {
        return post("/question-bank/{threadId}/review", threadId, decision);
    }

    public Flux<ServerSentEvent<String>> streamTimeline(String runId, String lastEventId) {
        WebClient.RequestHeadersSpec<?> request = webClient.get()
                .uri(uri -> uri.path("/workflows/{runId}/stream").build(runId))
                .accept(MediaType.TEXT_EVENT_STREAM);

        if (StringUtils.hasText(lastEventId)) {
            request = request.header("Last-Event-ID", lastEventId);
        }
        return request.retrieve().bodyToFlux(SSE);
    }

    private static final ParameterizedTypeReference<Map<String, Object>> MAP =
            new ParameterizedTypeReference<>() {};

    private static final ParameterizedTypeReference<ServerSentEvent<String>> SSE =
            new ParameterizedTypeReference<>() {};

    private interface UriFn {
        java.net.URI apply(UriBuilder builder);
    }

    private Map<String, Object> get(UriFn uriFn, String what) {
        try {
            return webClient.get()
                    .uri(uriFn::apply)
                    .retrieve()
                    .bodyToMono(MAP)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException(what + " failed", e);
        }
    }

    private Map<String, Object> postToRun(String path, String runId, String what) {
        try {
            return webClient.post()
                    .uri(uri -> uri.path(path).build(runId))
                    .retrieve()
                    .bodyToMono(MAP)
                    .block();
        } catch (WebClientResponseException e) {
            throw refusal(e, what + runId + " failed");
        } catch (Exception e) {
            throw new AiServiceException(what + runId + " failed", e);
        }
    }

    private RuntimeException refusal(WebClientResponseException e, String fallback) {
        if (!e.getStatusCode().is4xxClientError()) {
            return new AiServiceException(fallback, e);
        }
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        return new AiServiceStatusException(
                status == null ? HttpStatus.BAD_REQUEST : status,
                detailOf(e).orElse(fallback));
    }

    private Optional<String> detailOf(WebClientResponseException e) {
        try {
            Object detail = e.getResponseBodyAs(Map.class).get("detail");
            return detail == null ? Optional.empty() : Optional.of(String.valueOf(detail));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Map<String, Object> post(String path, String threadId, Map<String, Object> body) {
        try {
            return webClient.post()
                    .uri(uri -> uri.path(path).build(threadId))
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(MAP)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException("Review submission for " + threadId + " failed", e);
        }
    }
}
