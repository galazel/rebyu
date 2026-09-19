package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

/** Which assessments the adaptive engine runs, and how long each one is. */
@Component
@RequiredArgsConstructor
public class AdaptivePolicy {

    public static final Set<String> ADAPTIVE_TYPES =
            Set.of("LESSON_QUIZ", "MIDDLE_EXAM", "MAJOR_EXAM", "MOCK_EXAM", "DIAGNOSTIC");

    /** Item types answered in a workspace rather than by picking or typing a short answer. */
    private static final Set<String> WORKSPACE_TYPES = Set.of("CRITICAL_THINKING", "PROGRAMMING", "DIAGRAM");

    private final AdaptiveProperties properties;

    public boolean isAdaptiveType(String examTypeText) {
        return properties.isEnabled() && examTypeText != null && ADAPTIVE_TYPES.contains(examTypeText);
    }

    public int targetCount(String examTypeText) {
        Integer configured = properties.getItemCounts().get(examTypeText);
        return configured == null || configured <= 0 ? 10 : configured;
    }

    public static boolean isWorkspaceType(String questionType) {
        return questionType != null && WORKSPACE_TYPES.contains(questionType.trim().toUpperCase());
    }

    public static boolean isMultipleChoice(String questionType) {
        return "MULTIPLE_CHOICE".equalsIgnoreCase(questionType) || "MCQ".equalsIgnoreCase(questionType)
                || "TRUE_FALSE".equalsIgnoreCase(questionType);
    }
}
