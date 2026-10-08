package com.capstone.rebyu.knowledgecheck.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.assessment.service.EligibleQuestionService;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.knowledgecheck.dto.KnowledgeCheckDtos.CheckKeyItem;
import com.capstone.rebyu.knowledgecheck.dto.KnowledgeCheckDtos.CheckOffer;
import com.capstone.rebyu.assessment.entity.Choice;
import com.capstone.rebyu.assessment.entity.TextQuestionConfig;
import com.capstone.rebyu.learningtools.service.LearnerQuestionHistoryService;
import com.capstone.rebyu.progress.entity.LearnerCompletedLesson;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonKnowledgeCheckService {

    public static final String KNOWLEDGE_CHECK_EXAM_TYPE = "KNOWLEDGE_CHECK";

    public static final String KNOWLEDGE_CHECK_TARGET_SCOPE = "KNOWLEDGE_CHECK";

    private static final int CHECK_SIZE = 5;

    private static final Set<String> QUICK_TYPES = Set.of("MCQ", "MULTIPLE_CHOICE", "SHORT_ANSWER");

    private static final Duration COOLDOWN = Duration.ofDays(1);

    private static final Duration SKIM_COOLDOWN = Duration.ofMinutes(1);

    private final LearnerCompletedLessonRepository completedLessons;
    private final LessonRepository lessons;
    private final EligibleQuestionService eligibleQuestions;
    private final ExamRepository exams;
    private final ExamTypeRepository examTypes;
    private final ExamQuestionRepository examQuestions;
    private final QuestionRepository questions;
    private final LearnerQuestionHistoryService history;

    @Transactional(readOnly = true)
    public CheckOffer offer(Long learnerId, Long triggerLessonId) {
        return offer(learnerId, triggerLessonId, false);
    }

    @Transactional(readOnly = true)
    public CheckOffer offer(Long learnerId, Long triggerLessonId, boolean currentLessonOnly) {
        Lesson trigger = requireLesson(triggerLessonId);

        if (onCooldown(learnerId, currentLessonOnly)) {
            return CheckOffer.unavailable("cooldown");
        }

        Candidates candidates = candidateQuestions(learnerId, trigger, currentLessonOnly);
        if (candidates.questionIds().size() < CHECK_SIZE) {
            return CheckOffer.unavailable("not-enough-completed-lessons");
        }

        return CheckOffer.available(CHECK_SIZE, candidates.lessonNames());
    }

    @Transactional
    public CheckOffer create(Long learnerId, Long triggerLessonId) {
        return create(learnerId, triggerLessonId, false);
    }

    @Transactional
    public CheckOffer create(Long learnerId, Long triggerLessonId, boolean currentLessonOnly) {
        Lesson trigger = requireLesson(triggerLessonId);

        if (onCooldown(learnerId, currentLessonOnly)) {
            return CheckOffer.unavailable("cooldown");
        }

        Candidates candidates = candidateQuestions(learnerId, trigger, currentLessonOnly);
        if (candidates.questionIds().size() < CHECK_SIZE) {
            return CheckOffer.unavailable("not-enough-completed-lessons");
        }

        List<Long> chosen = currentLessonOnly
                ? List.of()
                : selectQuestions(learnerId, candidates);

        Certification certification = certificationOf(trigger);

        ExamType examType = examTypes.findByExamTypeText(KNOWLEDGE_CHECK_EXAM_TYPE)
                .orElseThrow(() -> new IllegalStateException(
                        "Exam type '" + KNOWLEDGE_CHECK_EXAM_TYPE
                                + "' is not seeded -- see ExamTypeSeeder"));

        LocalDateTime now = LocalDateTime.now();
        Exam exam = exams.save(Exam.builder()
                .certification(certification)
                .examType(examType)
                .title(currentLessonOnly ? "Skim challenge" : "Knowledge check")
                .isGenerated(true)
                .learner(Learner.builder().learnerId(learnerId).build())
                .lesson(currentLessonOnly ? trigger : null)
                .totalQuestions(currentLessonOnly ? CHECK_SIZE : chosen.size())
                .passingScore(new BigDecimal("60.00"))
                .status(Exam.Status.PUBLISHED)
                .targetScope(KNOWLEDGE_CHECK_TARGET_SCOPE)
                .publishedAt(now)
                .updatedAt(now)
                .releaseAnswersAfterSubmit(true)
                .build());

        int displayOrder = 1;
        for (Long questionId : chosen) {
            Question question = questions.getReferenceById(questionId);
            examQuestions.save(ExamQuestion.builder()
                    .exam(exam)
                    .question(question)
                    .displayOrder(displayOrder++)
                    .build());
        }

        int items = currentLessonOnly ? CHECK_SIZE : chosen.size();
        log.info("Knowledge check {} minted for learner {} on certification {} "
                        + "({} items from {} lesson(s), triggered on lesson {}{})",
                exam.getExamId(), learnerId, certification.getCertificationId(),
                items, candidates.lessonNames().size(), triggerLessonId,
                currentLessonOnly ? ", adaptive" : "");

        return CheckOffer.minted(exam.getExamId(), items, candidates.lessonNames());
    }

    private List<Long> selectQuestions(Long learnerId, Candidates candidates) {
        Set<Long> eligible = new LinkedHashSet<>(candidates.questionIds());

        List<Long> chosen = new ArrayList<>();

        for (Long missed : history.missedQuestionIds(learnerId, null, null)) {
            if (chosen.size() >= CHECK_SIZE) break;
            if (eligible.contains(missed) && !chosen.contains(missed)) {
                chosen.add(missed);
            }
        }

        if (chosen.size() < CHECK_SIZE) {
            List<Long> filler = new ArrayList<>(eligible);
            filler.removeAll(chosen);
            Collections.shuffle(filler, ThreadLocalRandom.current());
            for (Long candidate : filler) {
                if (chosen.size() >= CHECK_SIZE) break;
                chosen.add(candidate);
            }
        }

        return List.copyOf(chosen);
    }

    @Transactional(readOnly = true)
    public List<CheckKeyItem> answerKey(Long learnerId, Long examId) {
        Exam exam = exams.findById(examId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found: " + examId));
        boolean ownCheck = exam.getLearner() != null
                && learnerId.equals(exam.getLearner().getLearnerId())
                && KNOWLEDGE_CHECK_EXAM_TYPE.equals(exam.getExamType().getExamTypeText());
        if (!ownCheck) {
            throw new IllegalArgumentException("Not your knowledge check");
        }

        List<CheckKeyItem> key = new ArrayList<>();
        for (ExamQuestion examQuestion : examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(examId)) {
            Question question = questions.findById(examQuestion.getQuestion().getQuestionId()).orElse(null);
            if (question == null) continue;

            Choice correct = question.getChoices().stream().filter(Choice::isCorrect).findFirst().orElse(null);
            List<String> accepted = new ArrayList<>();
            String explanation = correct != null ? correct.getExplanation() : null;
            TextQuestionConfig text = question.getTextQuestionConfig();
            if (text != null) {
                if (text.getCorrectAnswer() != null) accepted.add(text.getCorrectAnswer());
                if (text.getAcceptedVariations() != null) {
                    for (String v : text.getAcceptedVariations().split("\n")) {
                        if (!v.isBlank()) accepted.add(v.trim());
                    }
                }
            }
            key.add(new CheckKeyItem(
                    question.getQuestionId(),
                    correct != null ? correct.getChoiceId() : null,
                    correct != null ? correct.getChoiceText() : null,
                    accepted,
                    explanation));
        }
        return key;
    }

    private boolean onCooldown(Long learnerId, boolean currentLessonOnly) {
        LocalDateTime lastServed = exams.findLastServedAt(learnerId, KNOWLEDGE_CHECK_EXAM_TYPE);
        Duration cooldown = currentLessonOnly ? SKIM_COOLDOWN : COOLDOWN;
        return lastServed != null && lastServed.isAfter(LocalDateTime.now().minus(cooldown));
    }

    private Lesson requireLesson(Long lessonId) {
        return lessons.findById(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found: " + lessonId));
    }

    private static Certification certificationOf(Lesson lesson) {
        return lesson.getMiddleCategory().getMajorCategory().getCertification();
    }

    private Candidates candidateQuestions(Long learnerId, Lesson trigger, boolean currentLessonOnly) {
        if (currentLessonOnly) {
            List<Long> questionIds = eligibleQuestions
                    .resolveScopeViews(null, null, null, trigger.getLessonId()).stream()
                    .filter(view -> view.getOwnerDepartmentId() == null)
                    .map(QuestionSelectionView::getQuestionId)
                    .filter(questionId -> questions.findById(questionId)
                            .map(question -> QUICK_TYPES.contains(question.getQuestionType()))
                            .orElse(false))
                    .toList();
            return new Candidates(questionIds,
                    questionIds.isEmpty() ? List.of() : List.of(trigger.getName()));
        }

        Long certificationId = certificationOf(trigger).getCertificationId();

        List<LearnerCompletedLesson> sameCertification = completedLessons
                .findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
                        learnerId, certificationId);

        List<LearnerCompletedLesson> done = new ArrayList<>(sameCertification);
        done.addAll(completedLessons.findByLearner_LearnerId(learnerId));

        Map<Long, String> sourceLessons = new LinkedHashMap<>();
        List<Long> questionIds = new ArrayList<>();

        for (LearnerCompletedLesson completed : done) {
            Lesson lesson = completed.getLesson();
            if (lesson == null || lesson.getLessonId().equals(trigger.getLessonId())) {
                continue;
            }
            if (sourceLessons.containsKey(lesson.getLessonId())) {
                continue;
            }

            List<Long> fromLesson = eligibleQuestions
                    .resolveScopeViews(null, null, null, lesson.getLessonId()).stream()
                    .filter(view -> view.getOwnerDepartmentId() == null)
                    .map(QuestionSelectionView::getQuestionId)
                    .toList();

            if (fromLesson.isEmpty()) {
                continue;
            }

            questionIds.addAll(fromLesson);
            sourceLessons.put(lesson.getLessonId(), lesson.getName());
        }

        return new Candidates(questionIds, List.copyOf(sourceLessons.values()));
    }

    private record Candidates(List<Long> questionIds, List<String> lessonNames) {}
}
