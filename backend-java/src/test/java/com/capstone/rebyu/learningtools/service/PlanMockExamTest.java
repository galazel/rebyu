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
import com.capstone.rebyu.bkt.service.LearnerMasteryService;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/** The study plan's mock exam covers finished lessons only, and needs at least one. */
class PlanMockExamTest {

  ExamRepository exams = mock(ExamRepository.class);
  ExamTypeRepository examTypes = mock(ExamTypeRepository.class);
  ExamQuestionRepository examQuestions = mock(ExamQuestionRepository.class);
  QuestionRepository questions = mock(QuestionRepository.class);
  CertificationRepository certifications = mock(CertificationRepository.class);
  EligibleQuestionService eligible = mock(EligibleQuestionService.class);
  LearnerCompletedLessonRepository completed = mock(LearnerCompletedLessonRepository.class);

  RecallExamService service = new RecallExamService(
      mock(LearnerQuestionHistoryService.class), exams, examTypes, examQuestions, questions,
      certifications, eligible, mock(LearnerMasteryService.class), completed);

  @BeforeEach
  void setUp() {
    when(certifications.findById(4L)).thenReturn(Optional.of(new Certification()));
    when(examTypes.findByExamTypeText("RECALL")).thenReturn(Optional.of(new ExamType()));
    when(exams.save(any())).thenAnswer(call -> {
      Exam exam = call.getArgument(0);
      exam.setExamId(99L);
      return exam;
    });
    when(questions.getReferenceById(any())).thenAnswer(call -> new Question());
  }

  @Test
  void refusesWhenNoLessonIsFinished() {
    when(completed.completedLessonIds(7L, 4L)).thenReturn(List.of());

    assertThatThrownBy(() -> service.createPlanMockExam(7L, 4L, null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Finish at least one lesson");
    verify(exams, never()).save(any());
  }

  @Test
  void usesOnlyFinishedLessonsAndSpreadsAcrossThem() {
    when(completed.completedLessonIds(7L, 4L)).thenReturn(List.of(10L, 20L));
    // Lesson 10 has a big bank, lesson 20 a small one; lesson 30 is not finished.
    List<QuestionSelectionView> big = views(1000, 40);
    List<QuestionSelectionView> small = views(2000, 5);
    when(eligible.resolveScopeViews(isNull(), any(), any(), eq(10L))).thenReturn(big);
    when(eligible.resolveScopeViews(isNull(), any(), any(), eq(20L))).thenReturn(small);
    when(questions.findSelectionViewsByIdIn(any())).thenAnswer(call -> {
      List<QuestionSelectionView> out = new ArrayList<>();
      for (Object id : (Collection<?>) call.getArgument(0)) out.add(view((Long) id));
      return out;
    });

    RecallExamService.RecallExam result = service.createPlanMockExam(7L, 4L, 10);

    assertThat(result.itemCount()).isEqualTo(10);
    verify(eligible, never()).resolveScopeViews(isNull(), any(), any(), eq(30L));

    ArgumentCaptor<ExamQuestion> saved = ArgumentCaptor.forClass(ExamQuestion.class);
    verify(examQuestions, times(10)).save(saved.capture());
    verify(questions, atLeast(1)).getReferenceById(any());

    ArgumentCaptor<Long> ids = ArgumentCaptor.forClass(Long.class);
    verify(questions, times(10)).getReferenceById(ids.capture());
    long fromSmallLesson = ids.getAllValues().stream().filter(id -> id >= 2000).count();
    assertThat(fromSmallLesson).isGreaterThanOrEqualTo(3); // not crowded out by the big lesson

    ArgumentCaptor<Exam> exam = ArgumentCaptor.forClass(Exam.class);
    verify(exams).save(exam.capture());
    assertThat(exam.getValue().getDurationMinutes()).isEqualTo(15);
    assertThat(exam.getValue().getTargetScope()).isEqualTo("RECALL");
  }

  private static List<QuestionSelectionView> views(long start, int count) {
    List<QuestionSelectionView> out = new ArrayList<>();
    for (long id = start; id < start + count; id++) out.add(view(id));
    return out;
  }

  private static QuestionSelectionView view(long id) {
    QuestionSelectionView view = mock(QuestionSelectionView.class);
    when(view.getQuestionId()).thenReturn(id);
    when(view.getOwnerGroupId()).thenReturn(null); // Mockito would otherwise answer 0L, a "private group"
    when(view.getQuestionText()).thenReturn("Distinct question number " + id + " about topic " + (id * 7919));
    return view;
  }
}
