package com.capstone.rebyu.knowledgecheck.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.assessment.service.EligibleQuestionService;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.knowledgecheck.dto.KnowledgeCheckDtos.CheckOffer;
import com.capstone.rebyu.learningtools.service.LearnerQuestionHistoryService;
import com.capstone.rebyu.progress.entity.LearnerCompletedLesson;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LessonKnowledgeCheckServiceTest {

    private static final Long LEARNER_ID = 1L;
    private static final Long CERTIFICATION_ID = 7L;

    private static final Long TRIGGER_LESSON_ID = 100L;

    private static final Long DONE_LESSON_A = 200L;
    private static final Long DONE_LESSON_B = 201L;

    private LearnerCompletedLessonRepository completedLessons;
    private LessonRepository lessons;
    private EligibleQuestionService eligibleQuestions;
    private ExamRepository exams;
    private ExamTypeRepository examTypes;
    private ExamQuestionRepository examQuestions;
    private QuestionRepository questions;
    private LearnerQuestionHistoryService history;

    private LessonKnowledgeCheckService service;

    private Certification certification;

    @BeforeEach
    void setUp() {
        completedLessons = mock(LearnerCompletedLessonRepository.class);
        lessons = mock(LessonRepository.class);
        eligibleQuestions = mock(EligibleQuestionService.class);
        exams = mock(ExamRepository.class);
        examTypes = mock(ExamTypeRepository.class);
        examQuestions = mock(ExamQuestionRepository.class);
        questions = mock(QuestionRepository.class);
        history = mock(LearnerQuestionHistoryService.class);

        service = new LessonKnowledgeCheckService(
                completedLessons, lessons, eligibleQuestions,
                exams, examTypes, examQuestions, questions, history);

        when(history.missedQuestionIds(anyLong(), any(), any())).thenReturn(List.of());

        certification = new Certification();
        certification.setCertificationId(CERTIFICATION_ID);

        when(lessons.findById(TRIGGER_LESSON_ID))
                .thenReturn(Optional.of(lesson(TRIGGER_LESSON_ID, "The lesson being read")));

        when(exams.findLastServedAt(anyLong(), anyString())).thenReturn(null);

        when(examTypes.findByExamTypeText(
                LessonKnowledgeCheckService.KNOWLEDGE_CHECK_EXAM_TYPE))
                .thenReturn(Optional.of(ExamType.builder().examTypeText(
                        LessonKnowledgeCheckService.KNOWLEDGE_CHECK_EXAM_TYPE).build()));

        when(exams.save(any(Exam.class))).thenAnswer(invocation -> {
            Exam exam = invocation.getArgument(0);
            exam.setExamId(999L);
            return exam;
        });
    }

    @Test
    void offersACheckWhenEnoughFinishedMaterialExists() {
        givenCompletedLessons(DONE_LESSON_A, DONE_LESSON_B);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L);
        givenQuestions(DONE_LESSON_B, 4L, 5L, 6L);

        CheckOffer offer = service.offer(LEARNER_ID, TRIGGER_LESSON_ID);

        assertTrue(offer.available());
        assertEquals(5, offer.itemCount());
        assertEquals(List.of("Lesson " + DONE_LESSON_A, "Lesson " + DONE_LESSON_B),
                offer.lessonNames());
    }

    @Test
    void fallsBackToFinishedLessonsOnOtherCertifications() {
        givenCompletedLessonsOnOtherCertifications(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L, 6L);

        CheckOffer offer = service.offer(LEARNER_ID, TRIGGER_LESSON_ID);

        assertTrue(offer.available());
        assertEquals(5, offer.itemCount());
        assertEquals(List.of("Lesson " + DONE_LESSON_A), offer.lessonNames());
    }

    @Test
    void refusesWhenFewerThanFiveQuestionsAreAvailable() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L);

        CheckOffer offer = service.offer(LEARNER_ID, TRIGGER_LESSON_ID);

        assertFalse(offer.available());
        assertEquals("not-enough-completed-lessons", offer.reason());
    }

    @Test
    void refusesASecondCheckLaterTheSameDay() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L, 6L);

        when(exams.findLastServedAt(
                LEARNER_ID, LessonKnowledgeCheckService.KNOWLEDGE_CHECK_EXAM_TYPE))
                .thenReturn(LocalDateTime.now().minusHours(8));

        CheckOffer offer = service.offer(LEARNER_ID, TRIGGER_LESSON_ID);

        assertFalse(offer.available());
        assertEquals("cooldown", offer.reason());
    }

    @Test
    void offersAgainOnceTheDayHasPassed() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L, 6L);

        when(exams.findLastServedAt(
                LEARNER_ID, LessonKnowledgeCheckService.KNOWLEDGE_CHECK_EXAM_TYPE))
                .thenReturn(LocalDateTime.now().minusDays(1).minusMinutes(1));

        CheckOffer offer = service.offer(LEARNER_ID, TRIGGER_LESSON_ID);

        assertTrue(offer.available());
    }

    @Test
    void neverDrawsFromTheLessonBeingRead() {
        givenCompletedLessons(TRIGGER_LESSON_ID, DONE_LESSON_A);
        givenQuestions(TRIGGER_LESSON_ID, 90L, 91L, 92L, 93L, 94L);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L);

        service.create(LEARNER_ID, TRIGGER_LESSON_ID);

        verify(questions, times(5)).getReferenceById(
                org.mockito.ArgumentMatchers.longThat(id -> id >= 1L && id <= 5L));
        verify(eligibleQuestions, never())
                .resolveScopeViews(isNull(), isNull(), isNull(), eq(TRIGGER_LESSON_ID));
    }

    @Test
    void mintsAFiveItemLearnerOwnedPublishedExam() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L, 6L, 7L);

        CheckOffer offer = service.create(LEARNER_ID, TRIGGER_LESSON_ID);

        assertTrue(offer.available());
        assertEquals(999L, offer.examId());
        assertEquals(5, offer.itemCount());

        org.mockito.ArgumentCaptor<Exam> saved =
                org.mockito.ArgumentCaptor.forClass(Exam.class);
        verify(exams).save(saved.capture());
        Exam exam = saved.getValue();

        assertEquals(5, exam.getTotalQuestions());
        assertEquals(Exam.Status.PUBLISHED, exam.getStatus());
        assertEquals(LessonKnowledgeCheckService.KNOWLEDGE_CHECK_TARGET_SCOPE,
                exam.getTargetScope());
        assertNotNull(exam.getLearner());
        assertEquals(LEARNER_ID, exam.getLearner().getLearnerId());
        assertTrue(exam.getReleaseAnswersAfterSubmit());

        verify(examQuestions, times(5)).save(any());
    }

    @Test
    void createRefusesOnCooldownEvenWithoutAPreflight() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L, 6L);

        when(exams.findLastServedAt(
                LEARNER_ID, LessonKnowledgeCheckService.KNOWLEDGE_CHECK_EXAM_TYPE))
                .thenReturn(LocalDateTime.now().minusHours(2));

        CheckOffer offer = service.create(LEARNER_ID, TRIGGER_LESSON_ID);

        assertFalse(offer.available());
        verify(exams, never()).save(any(Exam.class));
    }

    @Test
    void excludesDepartmentOwnedQuestions() {
        givenCompletedLessons(DONE_LESSON_A);

        List<QuestionSelectionView> views = new ArrayList<>();
        views.add(view(1L, DONE_LESSON_A, null));
        views.add(view(2L, DONE_LESSON_A, null));
        views.add(view(3L, DONE_LESSON_A, 42L));
        views.add(view(4L, DONE_LESSON_A, 42L));
        views.add(view(5L, DONE_LESSON_A, 42L));
        when(eligibleQuestions.resolveScopeViews(null, null, null, DONE_LESSON_A))
                .thenReturn(views);

        CheckOffer offer = service.offer(LEARNER_ID, TRIGGER_LESSON_ID);

        assertFalse(offer.available());
        assertEquals("not-enough-completed-lessons", offer.reason());
    }


    @Test
    void servesPreviouslyMissedQuestionsFirst() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);

        when(history.missedQuestionIds(LEARNER_ID, null, null))
                .thenReturn(List.of(7L, 3L, 9L, 1L, 5L));

        service.create(LEARNER_ID, TRIGGER_LESSON_ID);

        org.mockito.ArgumentCaptor<Long> served =
                org.mockito.ArgumentCaptor.forClass(Long.class);
        verify(questions, times(5)).getReferenceById(served.capture());
        assertEquals(List.of(7L, 3L, 9L, 1L, 5L), served.getAllValues());
    }

    @Test
    void topsUpFromTheBankWhenThereAreTooFewMistakes() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L);

        when(history.missedQuestionIds(LEARNER_ID, null, null))
                .thenReturn(List.of(8L, 6L));

        service.create(LEARNER_ID, TRIGGER_LESSON_ID);

        org.mockito.ArgumentCaptor<Long> served =
                org.mockito.ArgumentCaptor.forClass(Long.class);
        verify(questions, times(5)).getReferenceById(served.capture());
        List<Long> ids = served.getAllValues();

        assertEquals(List.of(8L, 6L), ids.subList(0, 2));
        assertEquals(5, java.util.Set.copyOf(ids).size());
    }

    @Test
    void ignoresMistakesOutsideTheEligiblePool() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L);

        when(history.missedQuestionIds(LEARNER_ID, null, null))
                .thenReturn(List.of(900L, 901L));

        service.create(LEARNER_ID, TRIGGER_LESSON_ID);

        org.mockito.ArgumentCaptor<Long> served =
                org.mockito.ArgumentCaptor.forClass(Long.class);
        verify(questions, times(5)).getReferenceById(served.capture());
        assertEquals(java.util.Set.of(1L, 2L, 3L, 4L, 5L),
                java.util.Set.copyOf(served.getAllValues()));
    }

    @Test
    void fallsBackEntirelyToTheBankWithNoMistakes() {
        givenCompletedLessons(DONE_LESSON_A);
        givenQuestions(DONE_LESSON_A, 1L, 2L, 3L, 4L, 5L);

        CheckOffer offer = service.create(LEARNER_ID, TRIGGER_LESSON_ID);

        assertTrue(offer.available());
        assertEquals(5, offer.itemCount());
        verify(questions, times(5)).getReferenceById(anyLong());
    }


    private void givenCompletedLessons(Long... lessonIds) {
        List<LearnerCompletedLesson> rows = completedRows(lessonIds);
        when(completedLessons
                .findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
                        LEARNER_ID, CERTIFICATION_ID))
                .thenReturn(rows);
        when(completedLessons.findByLearner_LearnerId(LEARNER_ID)).thenReturn(rows);
    }

    private void givenCompletedLessonsOnOtherCertifications(Long... lessonIds) {
        when(completedLessons
                .findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
                        LEARNER_ID, CERTIFICATION_ID))
                .thenReturn(List.of());
        when(completedLessons.findByLearner_LearnerId(LEARNER_ID))
                .thenReturn(completedRows(lessonIds));
    }

    private List<LearnerCompletedLesson> completedRows(Long... lessonIds) {
        List<LearnerCompletedLesson> rows = new ArrayList<>();
        for (Long id : lessonIds) {
            LearnerCompletedLesson row = new LearnerCompletedLesson();
            row.setLesson(lesson(id, "Lesson " + id));
            rows.add(row);
        }
        return rows;
    }

    private void givenQuestions(Long lessonId, Long... questionIds) {
        List<QuestionSelectionView> views = new ArrayList<>();
        for (Long questionId : questionIds) {
            views.add(view(questionId, lessonId, null));
        }
        when(eligibleQuestions.resolveScopeViews(null, null, null, lessonId))
                .thenReturn(views);
    }

    private Lesson lesson(Long lessonId, String name) {
        MajorCategory major = new MajorCategory();
        major.setCertification(certification);

        MiddleCategory middle = new MiddleCategory();
        middle.setMajorCategory(major);

        Lesson lesson = new Lesson();
        lesson.setLessonId(lessonId);
        lesson.setName(name);
        lesson.setMiddleCategory(middle);
        return lesson;
    }

    private static QuestionSelectionView view(Long questionId, Long lessonId, Long ownerDepartmentId) {
        return new QuestionSelectionView() {
            @Override public Long getQuestionId() { return questionId; }
            @Override public Long getLessonId() { return lessonId; }
            @Override public String getDifficultyLevel() { return "AVERAGE"; }
            @Override public String getQuestionText() { return "Q" + questionId; }
            @Override public Long getOwnerDepartmentId() { return ownerDepartmentId; }
            @Override public String getQuestionType() { return "MULTIPLE_CHOICE"; }
        };
    }
}
