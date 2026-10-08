package com.capstone.rebyu.bkt.service;

import com.capstone.rebyu.adaptive.service.AdaptivePolicy;
import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.bkt.config.BktProperties;
import com.capstone.rebyu.bkt.dto.BktMasteryEvent;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
@Component
public class BktEventFactory {

    private final BktProperties properties;

    private static final Set<String> KNOWN_DIFFICULTY = Set.of("EASY", "AVERAGE", "HARD");

    private static final Set<String> KNOWN_ASSESSMENT = Set.of(
            "DIAGNOSTIC", "LESSON_QUIZ", "MIDDLE_EXAM", "MOCK_EXAM",
            "KNOWLEDGE_CHECK", "GENERATED_QUIZ");

    private static final Map<String, String> ASSESSMENT_ALIASES = Map.ofEntries(
            Map.entry("DIAGNOSTIC", "DIAGNOSTIC"),
            Map.entry("DIAGNOSTIC_EXAM", "DIAGNOSTIC"),
            Map.entry("QUIZ", "LESSON_QUIZ"),
            Map.entry("LESSON_QUIZ", "LESSON_QUIZ"),
            Map.entry("RECALL", "LESSON_QUIZ"),
            Map.entry("PRACTICE", "LESSON_QUIZ"),
            Map.entry("REVIEW", "LESSON_QUIZ"),
            Map.entry("BATTLE", "LESSON_QUIZ"),
            Map.entry("CHALLENGE", "LESSON_QUIZ"),
            Map.entry("CUSTOM", "LESSON_QUIZ"),
            Map.entry("KNOWLEDGE_CHECK", "KNOWLEDGE_CHECK"),
            Map.entry("GENERATED_QUIZ", "GENERATED_QUIZ"),
            Map.entry("GENERATED_FLASHCARD", "GENERATED_QUIZ"),
            Map.entry("MODULE_EXAM", "MIDDLE_EXAM"),
            Map.entry("MIDDLE_EXAM", "MIDDLE_EXAM"),
            Map.entry("MIDDLE_CATEGORY_QUIZ", "MIDDLE_EXAM"),
            Map.entry("MAJOR_EXAM", "MOCK_EXAM"),
            Map.entry("MAJOR_CATEGORY_QUIZ", "MOCK_EXAM"),
            Map.entry("MOCK", "MOCK_EXAM"),
            Map.entry("MOCK_EXAM", "MOCK_EXAM"));

    public String buildEventId(Long attemptId, Long attemptQuestionId, int gradeVersion) {
        return "rebyu-attempt:" + attemptId + ":" + attemptQuestionId + ":v" + gradeVersion;
    }

    public BktMasteryEvent buildEvent(
            AssessmentAttempt attempt,
            AssessmentAttemptQuestion question,
            AssessmentAttemptAnswer answer,
            Question sourceQuestion,
            Long certificationId,
            String rawAssessmentType) {

        if (answer == null || answer.isPendingManualEvaluation()) {
            return null;
        }
        Long lessonId = question.getLessonId();
        if (lessonId == null) {
            return null;
        }

        boolean correct = resolveCorrectness(answer);
        double score = resolveScore(question, answer);
        String occurredAt = (answer.getAnsweredAt() != null
                ? answer.getAnsweredAt() : LocalDateTime.now()).toString();

        String rawDifficulty = null;
        String lessonTitle = null;
        Long middleCategoryId = null;
        String middleCategoryTitle = null;
        Long majorCategoryId = null;
        String majorCategoryTitle = null;
        if (sourceQuestion != null) {
            rawDifficulty = sourceQuestion.getDifficultyLevel();
            Lesson lesson = sourceQuestion.getLesson();
            if (lesson != null) {
                lessonTitle = lesson.getName();
                MiddleCategory middle = lesson.getMiddleCategory();
                if (middle != null) {
                    middleCategoryId = middle.getMiddleCategoryId();
                    middleCategoryTitle = middle.getTitle();
                    MajorCategory major = middle.getMajorCategory();
                    if (major != null) {
                        majorCategoryId = major.getMajorCategoryId();
                        majorCategoryTitle = major.getTitle();
                    }
                }
            }
        }

        return new BktMasteryEvent(
                buildEventId(attempt.getAssessmentAttemptId(), question.getAttemptQuestionId(), 1),
                attempt.getLearnerId(),
                certificationId,
                majorCategoryId,
                middleCategoryId,
                lessonId,
                lessonTitle,
                middleCategoryTitle,
                majorCategoryTitle,
                question.getSourceQuestionId(),
                correct,
                score,
                normalizeDifficulty(rawDifficulty),
                normalizeAssessmentType(rawAssessmentType),
                occurredAt);
    }

    public BktMasteryEvent buildEvent(
            String sourceEventId,
            Long learnerId,
            Long certificationId,
            Long majorCategoryId,
            String majorCategoryTitle,
            Long middleCategoryId,
            String middleCategoryTitle,
            Long lessonId,
            String lessonTitle,
            Long questionId,
            boolean isCorrect,
            String rawDifficulty,
            String rawAssessmentType) {
        return new BktMasteryEvent(
                sourceEventId,
                learnerId,
                certificationId,
                majorCategoryId,
                middleCategoryId,
                lessonId,
                lessonTitle,
                middleCategoryTitle,
                majorCategoryTitle,
                questionId,
                isCorrect,
                isCorrect ? 1.0 : 0.0,
                normalizeDifficulty(rawDifficulty),
                normalizeAssessmentType(rawAssessmentType),
                LocalDateTime.now().toString());
    }

    private double resolveScore(AssessmentAttemptQuestion question, AssessmentAttemptAnswer answer) {
        if (AdaptivePolicy.usesPartialCredit(question.getQuestionType())) {
            BigDecimal credit = answer.getCredit();
            if (credit != null) {
                return Math.min(1.0, Math.max(0.0, credit.doubleValue()));
            }
        }
        return resolveCorrectness(answer) ? 1.0 : 0.0;
    }

    private boolean resolveCorrectness(AssessmentAttemptAnswer answer) {
        if (answer.getIsCorrect() != null) {
            return Boolean.TRUE.equals(answer.getIsCorrect());
        }
        BigDecimal credit = answer.getCredit();
        return credit != null && credit.doubleValue() >= properties.getPartialCreditCorrectThreshold();
    }

    public String normalizeDifficulty(String rawDifficulty) {
        if (rawDifficulty == null) {
            return properties.getFallbackDifficulty();
        }
        String value = rawDifficulty.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        if (KNOWN_DIFFICULTY.contains(value)) {
            return value;
        }
        log.warn("Unrecognized BKT difficulty '{}'; falling back to {}",
                rawDifficulty, properties.getFallbackDifficulty());
        return properties.getFallbackDifficulty();
    }

    public String normalizeAssessmentType(String rawAssessmentType) {
        if (rawAssessmentType == null) {
            return properties.getFallbackAssessmentType();
        }
        String value = rawAssessmentType.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        String mapped = ASSESSMENT_ALIASES.get(value);
        if (mapped != null) {
            return mapped;
        }
        if (KNOWN_ASSESSMENT.contains(value)) {
            return value;
        }
        log.warn("Unrecognized BKT assessment type '{}'; falling back to {}",
                rawAssessmentType, properties.getFallbackAssessmentType());
        return properties.getFallbackAssessmentType();
    }
}
