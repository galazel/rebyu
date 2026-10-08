package com.capstone.rebyu.learningtools.service;

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
import com.capstone.rebyu.assessment.service.QuestionStem;
import com.capstone.rebyu.bkt.dto.LessonPriorityView;
import com.capstone.rebyu.bkt.service.LearnerMasteryService;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecallExamService {

  public static final String RECALL_EXAM_TYPE = "RECALL";

  public static final String RECALL_TARGET_SCOPE = "RECALL";

  private static final int DEFAULT_SIZE = 20;
  private static final int MAX_SIZE = 50;
  private static final int MOCK_DEFAULT_SIZE = 30;

  private static final double WEAK_MASTERY_CEILING = 0.7;

  private final LearnerQuestionHistoryService history;
  private final ExamRepository exams;
  private final ExamTypeRepository examTypes;
  private final ExamQuestionRepository examQuestions;
  private final QuestionRepository questions;
  private final CertificationRepository certifications;
  private final EligibleQuestionService eligibleQuestions;
  private final LearnerMasteryService mastery;
  private final LearnerCompletedLessonRepository completedLessons;

  public record RecallExam(
      Long examId, String title, Long certificationId, int itemCount, String basis) {}

  @Transactional
  public RecallExam createRecallExam(Long learnerId, Long certificationId, Long lessonId, Integer size) {
    if (certificationId == null) {
      throw new IllegalArgumentException("A certification is required to build a recall session");
    }

    int target = size == null ? DEFAULT_SIZE : Math.min(Math.max(size, 1), MAX_SIZE);

    Certification certification = certifications.findById(certificationId)
        .orElseThrow(() -> new EntityNotFoundException("Certification not found: " + certificationId));

    Set<Long> chosen = new LinkedHashSet<>();
    String basis = "history";

    List<Long> missedInTopic = lessonId == null ? List.of() : missedQuestionIds(learnerId, certificationId, lessonId);
    addUpTo(chosen, missedInTopic, target);

    addUpTo(chosen, missedQuestionIds(learnerId, certificationId, null), target);

    if (chosen.size() < target) {
      addUpTo(chosen, weakLessonQuestionIds(learnerId, certificationId, chosen), target);
    }

    if (chosen.size() < target && lessonId != null) {
      addUpTo(chosen, scopeQuestionIds(null, lessonId), target);
    }

    if (chosen.size() < target) {
      if (chosen.isEmpty()) {
        basis = "coverage";
      }
      addUpTo(chosen, scopeQuestionIds(certificationId, null), target);
    }



    List<Long> distinct = stemDistinct(chosen);

    if (distinct.size() < target) {
      Set<Long> used = new LinkedHashSet<>(distinct);
      List<Set<String>> usedTokens = tokensOf(distinct);
      for (QuestionSelectionView candidate : certificationCandidates(certificationId)) {
        if (distinct.size() >= target) {
          break;
        }
        Long candidateId = candidate.getQuestionId();
        if (candidateId == null || used.contains(candidateId)) {
          continue;
        }
        Set<String> tokens = QuestionStem.tokens(candidate.getQuestionText());
        if (!tokens.isEmpty() && isCopy(tokens, usedTokens)) {
          continue;
        }
        used.add(candidateId);
        distinct.add(candidateId);
        if (!tokens.isEmpty()) {
          usedTokens.add(tokens);
        }
      }
    }

    if (distinct.isEmpty()) {
      throw new IllegalStateException(
          "This certification has no questions to build a recall session from");
    }

    ExamType examType = examTypes.findByExamTypeText(RECALL_EXAM_TYPE)
        .orElseThrow(() -> new IllegalStateException(
            "Exam type '" + RECALL_EXAM_TYPE + "' is not seeded -- see ExamTypeSeeder"));

    LocalDateTime now = LocalDateTime.now();
    Exam exam = exams.save(Exam.builder()
        .certification(certification)
        .examType(examType)
        .title("Active recall · " + now.toLocalDate())
        .isGenerated(true)
        .learner(Learner.builder().learnerId(learnerId).build())
        .totalQuestions(distinct.size())
        .passingScore(new BigDecimal("70.00"))
        .status(Exam.Status.PUBLISHED)
        .targetScope(RECALL_TARGET_SCOPE)
        .publishedAt(now)
        .updatedAt(now)
        .releaseAnswersAfterSubmit(true)
        .build());

    int displayOrder = 1;
    for (Long questionId : distinct) {
      Question question = questions.getReferenceById(questionId);
      examQuestions.save(ExamQuestion.builder()
          .exam(exam)
          .question(question)
          .displayOrder(displayOrder++)
          .build());
    }

    log.info("Recall exam {} built for learner {} on certification {} ({} items, basis {})",
        exam.getExamId(), learnerId, certificationId, distinct.size(), basis);

    return new RecallExam(
        exam.getExamId(), exam.getTitle(), certificationId, distinct.size(), basis);
  }

  @Transactional
  public RecallExam createPlanMockExam(Long learnerId, Long certificationId, Integer size) {
    if (certificationId == null) {
      throw new IllegalArgumentException("A certification is required to build a mock exam");
    }
    int target = size == null ? MOCK_DEFAULT_SIZE : Math.min(Math.max(size, 1), MAX_SIZE);

    Certification certification = certifications.findById(certificationId)
        .orElseThrow(() -> new EntityNotFoundException("Certification not found: " + certificationId));

    List<Long> finished = completedLessons.completedLessonIds(learnerId, certificationId);
    if (finished.isEmpty()) {
      throw new IllegalArgumentException(
          "Finish at least one lesson in this certification first -- the mock exam only covers lessons you have finished.");
    }

    List<List<Long>> pools = new ArrayList<>();
    for (Long finishedLessonId : finished) {
      List<Long> pool = new ArrayList<>(scopeQuestionIds(null, finishedLessonId));
      Collections.shuffle(pool);
      if (!pool.isEmpty()) {
        pools.add(pool);
      }
    }
    if (pools.isEmpty()) {
      throw new IllegalStateException("The lessons you have finished have no questions yet");
    }

    Set<Long> dealt = new LinkedHashSet<>();
    int limit = target * 2;
    for (int round = 0; dealt.size() < limit; round++) {
      boolean any = false;
      for (List<Long> pool : pools) {
        if (round < pool.size()) {
          dealt.add(pool.get(round));
          any = true;
          if (dealt.size() >= limit) break;
        }
      }
      if (!any) break;
    }

    List<Long> distinct = stemDistinct(dealt);
    if (distinct.size() > target) {
      distinct = new ArrayList<>(distinct.subList(0, target));
    }
    Collections.shuffle(distinct);

    ExamType examType = examTypes.findByExamTypeText(RECALL_EXAM_TYPE)
        .orElseThrow(() -> new IllegalStateException(
            "Exam type '" + RECALL_EXAM_TYPE + "' is not seeded -- see ExamTypeSeeder"));

    LocalDateTime now = LocalDateTime.now();
    Exam exam = exams.save(Exam.builder()
        .certification(certification)
        .examType(examType)
        .title("Study plan mock exam · " + now.toLocalDate())
        .isGenerated(true)
        .learner(Learner.builder().learnerId(learnerId).build())
        .totalQuestions(distinct.size())
        .durationMinutes(Math.max(10, (int) Math.ceil(distinct.size() * 1.5)))
        .passingScore(new BigDecimal("70.00"))
        .status(Exam.Status.PUBLISHED)
        .targetScope(RECALL_TARGET_SCOPE)
        .publishedAt(now)
        .updatedAt(now)
        .releaseAnswersAfterSubmit(true)
        .build());

    int displayOrder = 1;
    for (Long questionId : distinct) {
      examQuestions.save(ExamQuestion.builder()
          .exam(exam)
          .question(questions.getReferenceById(questionId))
          .displayOrder(displayOrder++)
          .build());
    }

    log.info("Plan mock exam {} built for learner {} on certification {} ({} items from {} finished lessons)",
        exam.getExamId(), learnerId, certificationId, distinct.size(), finished.size());

    return new RecallExam(exam.getExamId(), exam.getTitle(), certificationId, distinct.size(), "finished-lessons");
  }

  private List<Long> missedQuestionIds(Long learnerId, Long certificationId, Long lessonId) {
    return history.missedQuestionIds(learnerId, certificationId, lessonId);
  }

  private List<Long> weakLessonQuestionIds(Long learnerId, Long certificationId, Set<Long> alreadyChosen) {
    LearnerMasteryService.LessonPrioritiesResult priorities =
        mastery.getLessonPrioritiesForAnalytics(learnerId, certificationId);

    if (!priorities.available() || priorities.lessons() == null) {
      return List.of();
    }

    List<Long> weakestLessonIds = priorities.lessons().stream()
        .filter(lesson -> lesson.lessonId() != null)
        .filter(lesson -> lesson.masteryProbability() == null
            || lesson.masteryProbability() < WEAK_MASTERY_CEILING)
        .sorted(Comparator.comparingDouble(
            lesson -> lesson.masteryProbability() == null ? 0d : lesson.masteryProbability()))
        .map(LessonPriorityView::lessonId)
        .toList();

    List<Long> picked = new ArrayList<>();
    for (Long weakLessonId : weakestLessonIds) {
      for (Long questionId : scopeQuestionIds(null, weakLessonId)) {
        if (!alreadyChosen.contains(questionId)) {
          picked.add(questionId);
        }
      }
    }
    return picked;
  }

  private List<Long> scopeQuestionIds(Long certificationId, Long lessonId) {
    return eligibleQuestions.resolveScopeViews(certificationId, null, null, lessonId).stream()
        .filter(view -> view.getOwnerDepartmentId() == null)
        .map(QuestionSelectionView::getQuestionId)
        .toList();
  }

  private List<Long> stemDistinct(Set<Long> ids) {
    if (ids.isEmpty()) {
      return new ArrayList<>();
    }
    Map<Long, String> textById = new HashMap<>();
    for (QuestionSelectionView view : questions.findSelectionViewsByIdIn(ids)) {
      textById.put(view.getQuestionId(), view.getQuestionText());
    }

    List<Long> distinct = new ArrayList<>(ids.size());
    List<Set<String>> keptTokens = new ArrayList<>();
    for (Long id : ids) {
      String questionText = textById.get(id);
      Set<String> candidate = QuestionStem.tokens(questionText);
      if (candidate.isEmpty() || !isCopy(candidate, keptTokens)) {
        distinct.add(id);
        if (!candidate.isEmpty()) {
          keptTokens.add(candidate);
        }
      }
    }
    return distinct;
  }

  private static boolean isCopy(Set<String> candidate, List<Set<String>> kept) {
    for (Set<String> existing : kept) {
      if (candidate.equals(existing) || QuestionStem.sameQuestion(candidate, existing)) {
        return true;
      }
    }
    return false;
  }

  private List<Set<String>> tokensOf(List<Long> ids) {
    List<Set<String>> tokens = new ArrayList<>();
    if (ids.isEmpty()) {
      return tokens;
    }
    for (QuestionSelectionView view : questions.findSelectionViewsByIdIn(ids)) {
      Set<String> stem = QuestionStem.tokens(view.getQuestionText());
      if (!stem.isEmpty()) {
        tokens.add(stem);
      }
    }
    return tokens;
  }

  private List<QuestionSelectionView> certificationCandidates(Long certificationId) {
    return eligibleQuestions.resolveScopeViews(certificationId, null, null, null).stream()
        .filter(view -> view.getOwnerDepartmentId() == null)
        .toList();
  }

  private static void addUpTo(Set<Long> chosen, List<Long> candidates, int target) {
    for (Long candidate : candidates) {
      if (chosen.size() >= target) return;
      if (candidate != null) chosen.add(candidate);
    }
  }

  public Map<String, Object> describe(RecallExam exam) {
    return Map.of("examId", exam.examId(), "itemCount", exam.itemCount(), "basis", exam.basis());
  }
}
