package com.capstone.rebyu.bkt.client;

import com.capstone.rebyu.bkt.dto.BktMasteryEventBatch;
import com.capstone.rebyu.bkt.dto.ConfidenceView;
import com.capstone.rebyu.bkt.dto.LearnerMasteryView;
import com.capstone.rebyu.bkt.dto.LessonPriorityView;
import com.capstone.rebyu.bkt.dto.MasteryHistoryView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class BktClient {

    private final WebClient webClient;

    public BktClient(@Qualifier("bktWebClient") WebClient bktWebClient) {
        this.webClient = bktWebClient;
    }

    public void sendBatch(BktMasteryEventBatch batch) {
        String correlationId = UUID.randomUUID().toString();
        try {
            webClient.post()
                    .uri("/mastery/events/batch")
                    .header("X-Correlation-Id", correlationId)
                    .bodyValue(batch)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.debug("BKT batch dispatched: {} events (correlationId={})",
                    batch.events().size(), correlationId);
        } catch (WebClientResponseException e) {
            throw new BktServiceException(
                    "BKT batch rejected with status " + e.getStatusCode()
                            + " (correlationId=" + correlationId + ")", e);
        } catch (Exception e) {
            throw new BktServiceException(
                    "BKT service unavailable (correlationId=" + correlationId + ")", e);
        }
    }

    public LearnerMasteryView getLearnerMastery(Long learnerId, List<Long> lessonIds) {
        try {
            return webClient.get()
                    .uri(uriBuilder -> {
                        var b = uriBuilder.path("/mastery/learners/{learnerId}");
                        if (lessonIds != null) {
                            for (Long lessonId : lessonIds) {
                                b.queryParam("lesson_id", lessonId);
                            }
                        }
                        return b.build(learnerId);
                    })
                    .retrieve()
                    .bodyToMono(LearnerMasteryView.class)
                    .block();
        } catch (Exception e) {
            throw new BktServiceException("Could not load learner mastery for " + learnerId, e);
        }
    }

    public Map<String, Object> computeReadiness(Map<String, Object> request) {
        return postMap("/analytics/readiness", request, "compute readiness");
    }

    public Map<String, Object> getPriorities(Long learnerId, Long certificationId) {
        return getMap("/priorities/learners/" + learnerId + "/certifications/" + certificationId,
                "load priorities");
    }

    public Map<String, Object> getConfidence(Long learnerId, Long certificationId) {
        return getMap("/priorities/learners/" + learnerId + "/certifications/"
                + certificationId + "/confidence", "load confidence");
    }

    public List<LessonPriorityView> getLessonPriorities(Long learnerId, Long certificationId) {
        try {
            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/priorities/learners/{learnerId}/certifications/{certificationId}/lessons")
                            .build(learnerId, certificationId))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<LessonPriorityView>>() {
                    })
                    .block();
        } catch (Exception e) {
            throw new BktServiceException("Could not load lesson priorities for learner " + learnerId, e);
        }
    }

    public ConfidenceView getConfidenceView(Long learnerId, Long certificationId) {
        try {
            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/priorities/learners/{learnerId}/certifications/{certificationId}/confidence")
                            .build(learnerId, certificationId))
                    .retrieve()
                    .bodyToMono(ConfidenceView.class)
                    .block();
        } catch (Exception e) {
            throw new BktServiceException("Could not load confidence view for learner " + learnerId, e);
        }
    }

    public List<MasteryHistoryView> getMasteryHistory(Long learnerId, Long certificationId) {
        try {
            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/mastery/learners/{learnerId}/certifications/{certificationId}/history")
                            .build(learnerId, certificationId))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<MasteryHistoryView>>() {
                    })
                    .block();
        } catch (Exception e) {
            throw new BktServiceException("Could not load mastery history for learner " + learnerId, e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> purgeLearnerState(Long learnerId) {
        try {
            return webClient.delete()
                    .uri("/mastery/learners/{learnerId}", learnerId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            throw new BktServiceException("Could not purge BKT state for learner " + learnerId, e);
        }
    }

    private Map<String, Object> getMap(String path, String action) {
        try {
            return webClient.get().uri(path).retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            throw new BktServiceException("Could not " + action, e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> postMap(String path, Object body, String action) {
        try {
            return webClient.post().uri(path).bodyValue(body)
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            throw new BktServiceException("Could not " + action, e);
        }
    }
}
