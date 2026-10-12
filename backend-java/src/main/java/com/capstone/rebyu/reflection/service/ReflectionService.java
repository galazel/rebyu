package com.capstone.rebyu.reflection.service;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.dto.AnswerGradingRequestDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingRequestDto.SubQuestionGradingRequestDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto.SubAnswerGradeDto;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.repository.MiddleCategoryRepository;
import com.capstone.rebyu.reflection.dto.ReflectionDtos.GeneratedReflection;
import com.capstone.rebyu.reflection.dto.ReflectionDtos.GenerationRequest;
import com.capstone.rebyu.reflection.dto.ReflectionDtos.ReflectionView;
import com.capstone.rebyu.reflection.dto.ReflectionDtos.SubmissionView;
import com.capstone.rebyu.reflection.entity.MiddleReflection;
import com.capstone.rebyu.reflection.entity.MiddleReflection.Criterion;
import com.capstone.rebyu.reflection.entity.ReflectionSubmission;
import com.capstone.rebyu.reflection.entity.ReflectionSubmission.CriterionGrade;
import com.capstone.rebyu.reflection.repository.MiddleReflectionRepository;
import com.capstone.rebyu.reflection.repository.ReflectionSubmissionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Topic self-reflections: a Coursera-style practice assignment that gates the
 * topic exam. It is a self-report, so it awards no XP and never feeds the
 * learner's proficiency -- passing it only unlocks the exam.
 *
 * <p>Marking reuses the written-answer grader: each rubric criterion is sent as
 * one sub-question worth one point, all against the same answer, which gives a
 * per-criterion mark and explanation without a second grading endpoint.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReflectionService {

    private static final BigDecimal ONE = BigDecimal.ONE;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final int MAX_ANSWER_CHARS = 6000;
    private static final int MIN_ANSWER_CHARS = 20;

    private final MiddleReflectionRepository reflections;
    private final ReflectionSubmissionRepository submissions;
    private final MiddleCategoryRepository middleCategories;
    private final AiServiceClient aiServiceClient;
    private final TransactionTemplate transactions;

    public ReflectionView view(Long learnerId, Long middleCategoryId) {
        MiddleReflection reflection = requireOrGenerate(middleCategoryId);
        return toView(reflection, learnerId);
    }

    /** True when the topic has no reflection, or the learner has passed it. */
    public boolean clearedOrAbsent(Long middleCategoryId, Long learnerId) {
        return reflections.findByMiddleCategoryId(middleCategoryId)
                .map(r -> submissions.existsByReflectionIdAndLearnerIdAndPassedTrue(r.getReflectionId(), learnerId))
                .orElse(true);
    }

    public ReflectionView submit(Long learnerId, Long middleCategoryId, String rawAnswer) {
        String answer = rawAnswer == null ? "" : rawAnswer.strip();
        if (answer.length() < MIN_ANSWER_CHARS) {
            throw new IllegalArgumentException("Write a little more -- your reflection should cover all three parts.");
        }
        if (answer.length() > MAX_ANSWER_CHARS) {
            throw new IllegalArgumentException("Keep your reflection under " + MAX_ANSWER_CHARS + " characters.");
        }

        MiddleReflection reflection = reflections.findByMiddleCategoryId(middleCategoryId)
                .orElseThrow(() -> new EntityNotFoundException("This topic has no reflection"));

        AnswerGradingResultDto result = aiServiceClient.gradeAnswer(gradingRequest(reflection, answer))
                .orElseThrow(() -> new IllegalStateException(
                        "Grading is unavailable right now. Your answer was not submitted -- please try again."));

        List<CriterionGrade> grades = grades(reflection, result);
        BigDecimal earned = grades.stream().map(CriterionGrade::earnedPoints).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal max = BigDecimal.valueOf(grades.size());
        BigDecimal percent = max.signum() == 0 ? BigDecimal.ZERO
                : earned.multiply(HUNDRED).divide(max, 2, RoundingMode.DOWN);
        boolean passed = percent.compareTo(BigDecimal.valueOf(reflection.getPassPercent())) >= 0;

        submissions.save(ReflectionSubmission.builder()
                .reflectionId(reflection.getReflectionId())
                .learnerId(learnerId)
                .answer(answer)
                .scorePercent(percent)
                .passed(passed)
                .feedback(result.feedback())
                .grades(grades)
                .submittedAt(LocalDateTime.now())
                .build());

        log.info("Reflection {} submitted by learner {}: {}% ({})",
                reflection.getReflectionId(), learnerId, percent, passed ? "passed" : "not passed");
        return toView(reflection, learnerId);
    }

    private AnswerGradingRequestDto gradingRequest(MiddleReflection reflection, String answer) {
        String assignment = reflection.getScenario() + "\n\n" + reflection.getPrompt() + "\n"
                + String.join("\n", reflection.getParts().stream().map(p -> "- " + p).toList())
                + "\n\nThis is a personal self-reflection, not a knowledge test. Mark each criterion on "
                + "whether the answer genuinely addresses it, not on polish. Award either 0% or 100% "
                + "per criterion. Do not penalise informal wording or simple English.";

        List<SubQuestionGradingRequestDto> subs = new ArrayList<>();
        List<Criterion> rubric = reflection.getRubric();
        for (int i = 0; i < rubric.size(); i++) {
            Criterion c = rubric.get(i);
            subs.add(new SubQuestionGradingRequestDto(
                    (long) (i + 1),
                    assignment + "\n\nCriterion " + (i + 1) + ": " + c.title() + ". " + c.description(),
                    ONE,
                    "0 points: " + c.zeroPoint() + "\n1 point: " + c.onePoint(),
                    List.of(),
                    answer));
        }
        return new AnswerGradingRequestDto(assignment, BigDecimal.valueOf(rubric.size()), null, List.of(), answer, subs);
    }

    private List<CriterionGrade> grades(MiddleReflection reflection, AnswerGradingResultDto result) {
        Map<Long, SubAnswerGradeDto> byId = (result.subScores() == null ? List.<SubAnswerGradeDto>of() : result.subScores())
                .stream()
                .filter(s -> s.subQuestionId() != null)
                .collect(Collectors.toMap(SubAnswerGradeDto::subQuestionId, Function.identity(), (a, b) -> a));
        List<CriterionGrade> grades = new ArrayList<>();
        for (int i = 0; i < reflection.getRubric().size(); i++) {
            SubAnswerGradeDto sub = byId.get((long) (i + 1));
            BigDecimal raw = sub == null || sub.earnedPoints() == null ? BigDecimal.ZERO : sub.earnedPoints();
            BigDecimal point = raw.compareTo(new BigDecimal("0.5")) >= 0 ? ONE : BigDecimal.ZERO;
            grades.add(new CriterionGrade(i + 1, point, ONE, sub == null ? null : sub.feedback()));
        }
        return grades;
    }

    private MiddleReflection requireOrGenerate(Long middleCategoryId) {
        return reflections.findByMiddleCategoryId(middleCategoryId).orElseGet(() -> generate(middleCategoryId));
    }

    /** Back-fills a topic generated before reflections existed. Runs outside a transaction: the AI call is slow. */
    private MiddleReflection generate(Long middleCategoryId) {
        GenerationRequest request = transactions.execute(status -> {
            MiddleCategory middle = middleCategories.findById(middleCategoryId)
                    .orElseThrow(() -> new EntityNotFoundException("Topic not found: " + middleCategoryId));
            var major = middle.getMajorCategory();
            return new GenerationRequest(
                    major.getCertification() == null ? "" : major.getCertification().getTitle(),
                    major.getTitle(),
                    middle.getTitle(),
                    middle.getLessons().stream().map(Lesson::getName).toList(),
                    "");
        });

        GeneratedReflection generated = aiServiceClient.generateReflection(request);
        if (generated == null || generated.parts() == null || generated.rubric() == null
                || generated.parts().isEmpty() || generated.rubric().isEmpty()) {
            throw new IllegalStateException("The reflection for this topic could not be prepared. Please try again.");
        }

        LocalDateTime now = LocalDateTime.now();
        try {
            return reflections.save(MiddleReflection.builder()
                    .middleCategoryId(middleCategoryId)
                    .title(generated.title() == null || generated.title().isBlank()
                            ? "Reflection: " + request.middleCategory() : generated.title())
                    .scenario(nullToEmpty(generated.scenario()))
                    .prompt(nullToEmpty(generated.prompt()))
                    .parts(generated.parts())
                    .rubric(generated.rubric())
                    .passPercent(MiddleReflection.DEFAULT_PASS_PERCENT)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        } catch (DataIntegrityViolationException raced) {
            return reflections.findByMiddleCategoryId(middleCategoryId).orElseThrow(() -> raced);
        }
    }

    private ReflectionView toView(MiddleReflection reflection, Long learnerId) {
        List<ReflectionSubmission> mine = submissions
                .findByReflectionIdAndLearnerIdOrderBySubmittedAtDesc(reflection.getReflectionId(), learnerId);
        ReflectionSubmission latest = mine.isEmpty() ? null : mine.get(0);
        ReflectionSubmission best = mine.stream()
                .max(Comparator.comparing(ReflectionSubmission::getScorePercent)
                        .thenComparing(ReflectionSubmission::getSubmittedAt))
                .orElse(null);
        String middleTitle = middleCategories.findById(reflection.getMiddleCategoryId())
                .map(MiddleCategory::getTitle).orElse(null);
        return new ReflectionView(
                reflection.getReflectionId(),
                reflection.getMiddleCategoryId(),
                middleTitle,
                reflection.getTitle(),
                reflection.getScenario(),
                reflection.getPrompt(),
                reflection.getParts(),
                reflection.getRubric(),
                reflection.getPassPercent(),
                mine.size(),
                mine.stream().anyMatch(s -> Boolean.TRUE.equals(s.getPassed())),
                toView(latest),
                toView(best));
    }

    private static SubmissionView toView(ReflectionSubmission s) {
        if (s == null) {
            return null;
        }
        return new SubmissionView(s.getSubmissionId(), s.getAnswer(), s.getScorePercent(),
                Boolean.TRUE.equals(s.getPassed()), s.getFeedback(), s.getGrades(), s.getSubmittedAt());
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
