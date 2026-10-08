package com.capstone.rebyu.bkt.service;

import com.capstone.rebyu.bkt.client.BktClient;
import com.capstone.rebyu.bkt.client.BktServiceException;
import com.capstone.rebyu.bkt.config.BktProperties;
import com.capstone.rebyu.bkt.dto.ConfidenceView;
import com.capstone.rebyu.bkt.dto.LearnerMasteryView;
import com.capstone.rebyu.bkt.dto.LessonPriorityView;
import com.capstone.rebyu.bkt.dto.MasteryHistoryView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Service
public class LearnerMasteryService {

    public record LessonPrioritiesResult(List<LessonPriorityView> lessons, boolean available) {
    }

    public record ConfidenceResult(ConfidenceView confidence, boolean available) {
    }

    public record MasteryHistoryResult(List<MasteryHistoryView> history, boolean available) {
    }

    private final BktClient bktClient;
    private final BktProperties properties;

    public LearnerMasteryView getMastery(Long learnerId, List<Long> lessonIds) {
        if (!properties.isEnabled()) {
            return emptyMastery();
        }
        try {
            LearnerMasteryView view = bktClient.getLearnerMastery(learnerId, lessonIds);
            return view != null ? view : emptyMastery();
        } catch (BktServiceException e) {
            log.warn("Mastery unavailable for learner {}: {}", learnerId, e.getMessage());
            return emptyMastery();
        }
    }

    public Map<String, Object> getReadiness(Map<String, Object> request) {
        if (!properties.isEnabled()) {
            return Map.of("status", "TEMPORARILY_UNAVAILABLE");
        }
        try {
            Map<String, Object> result = bktClient.computeReadiness(request);
            return result != null ? result : Map.of("status", "TEMPORARILY_UNAVAILABLE");
        } catch (BktServiceException e) {
            log.warn("Readiness unavailable: {}", e.getMessage());
            return Map.of("status", "TEMPORARILY_UNAVAILABLE");
        }
    }

    public Map<String, Object> getPriorities(Long learnerId, Long certificationId) {
        Map<String, Object> empty = Map.of(
                "certificationId", certificationId,
                "summary", Map.of(),
                "majorCategories", List.of(),
                "status", "TEMPORARILY_UNAVAILABLE");
        if (!properties.isEnabled()) {
            return empty;
        }
        try {
            Map<String, Object> result = bktClient.getPriorities(learnerId, certificationId);
            return result != null ? result : empty;
        } catch (BktServiceException e) {
            log.warn("Priorities unavailable for learner {}: {}", learnerId, e.getMessage());
            return empty;
        }
    }

    public Map<String, Object> getConfidence(Long learnerId, Long certificationId) {
        if (!properties.isEnabled()) {
            return Map.of("status", "TEMPORARILY_UNAVAILABLE");
        }
        try {
            Map<String, Object> result = bktClient.getConfidence(learnerId, certificationId);
            return result != null ? result : Map.of("status", "TEMPORARILY_UNAVAILABLE");
        } catch (BktServiceException e) {
            log.warn("Confidence unavailable for learner {}: {}", learnerId, e.getMessage());
            return Map.of("status", "TEMPORARILY_UNAVAILABLE");
        }
    }

    public LessonPrioritiesResult getLessonPrioritiesForAnalytics(Long learnerId, Long certificationId) {
        if (!properties.isEnabled()) {
            return new LessonPrioritiesResult(List.of(), false);
        }
        try {
            List<LessonPriorityView> lessons = bktClient.getLessonPriorities(learnerId, certificationId);
            return new LessonPrioritiesResult(lessons != null ? lessons : List.of(), true);
        } catch (BktServiceException e) {
            log.warn("Lesson priorities unavailable for learner {}: {}", learnerId, e.getMessage());
            return new LessonPrioritiesResult(List.of(), false);
        }
    }

    public ConfidenceResult getConfidenceForAnalytics(Long learnerId, Long certificationId) {
        if (!properties.isEnabled()) {
            return new ConfidenceResult(null, false);
        }
        try {
            ConfidenceView confidence = bktClient.getConfidenceView(learnerId, certificationId);
            return new ConfidenceResult(confidence, true);
        } catch (BktServiceException e) {
            log.warn("Confidence view unavailable for learner {}: {}", learnerId, e.getMessage());
            return new ConfidenceResult(null, false);
        }
    }

    public MasteryHistoryResult getMasteryHistoryForAnalytics(Long learnerId, Long certificationId) {
        if (!properties.isEnabled()) {
            return new MasteryHistoryResult(List.of(), false);
        }
        try {
            List<MasteryHistoryView> history = bktClient.getMasteryHistory(learnerId, certificationId);
            return new MasteryHistoryResult(history != null ? history : List.of(), true);
        } catch (BktServiceException e) {
            log.warn("Mastery history unavailable for learner {}: {}", learnerId, e.getMessage());
            return new MasteryHistoryResult(List.of(), false);
        }
    }

    private LearnerMasteryView emptyMastery() {
        return new LearnerMasteryView(List.of(), 0, 0.0);
    }
}
