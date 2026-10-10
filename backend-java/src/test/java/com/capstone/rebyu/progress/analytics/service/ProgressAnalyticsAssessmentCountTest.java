package com.capstone.rebyu.progress.analytics.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.bkt.config.BktProperties;
import com.capstone.rebyu.bkt.service.BktEventFactory;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.learningtools.service.GeneratedAssessmentService;
import com.capstone.rebyu.user.entity.Learner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class ProgressAnalyticsAssessmentCountTest {

    private static final Set<Long> OFFICIAL_LESSONS = Set.of(1L);
    private static final Set<Long> OFFICIAL_MIDDLES = Set.of(1L);
    private static final Set<Long> OFFICIAL_MAJORS = Set.of(1L);

    private ProgressAnalyticsService service;

    @BeforeEach
    void setUp() {
        BktEventFactory eventFactory = new BktEventFactory(new BktProperties());
        service = new ProgressAnalyticsService(
                null, null, null, null, null, null, null, null,
                null, null, null, null, eventFactory, Runnable::run);
    }

    private static ExamType type(String text) {
        ExamType examType = new ExamType();
        examType.setExamTypeText(text);
        return examType;
    }

    private static Exam exam(Long id, String title, String typeText) {
        Exam exam = new Exam();
        exam.setExamId(id);
        exam.setTitle(title);
        exam.setExamType(type(typeText));
        exam.setStatus(Exam.Status.PUBLISHED);
        exam.setGenerated(false);
        return exam;
    }

    private static Exam onLesson(Exam exam, Long lessonId) {
        Lesson lesson = new Lesson();
        lesson.setLessonId(lessonId);
        exam.setLesson(lesson);
        return exam;
    }

    private static Exam onMiddle(Exam exam, Long middleId) {
        MiddleCategory middle = new MiddleCategory();
        middle.setMiddleCategoryId(middleId);
        exam.setMiddleCategory(middle);
        return exam;
    }

    private static Exam onMajor(Exam exam, Long majorId) {
        MajorCategory major = new MajorCategory();
        major.setMajorCategoryId(majorId);
        exam.setMajorCategory(major);
        return exam;
    }

    private String reasonFor(Exam exam) {
        return service.assessmentExclusionReason(
                exam, OFFICIAL_LESSONS, OFFICIAL_MIDDLES, OFFICIAL_MAJORS);
    }


    @Test
    void countsTheLessonQuiz() {
        assertNull(reasonFor(onLesson(exam(1L, "Management of Software Requirements Quiz",
                "LESSON_QUIZ"), 1L)));
    }

    @Test
    void countsTheUnitExam() {
        assertNull(reasonFor(onMiddle(exam(2L, "Requirements Engineering Fundamentals Exam",
                "MIDDLE_EXAM"), 1L)));
    }

    @Test
    void countsTheMockExam() {
        assertNull(reasonFor(onMajor(exam(3L, "Software Requirements Management Exam",
                "MAJOR_EXAM"), 1L)));
    }

    @Test
    void countsACertificationLevelExamWithNoTarget() {
        assertNull(reasonFor(exam(9L, "Final Mock", "MOCK_EXAM")));
    }

    @Test
    void excludesTheDiagnostic() {
        String reason = reasonFor(exam(4L, "Diagnostic Exam", "DIAGNOSTIC"));
        assertNotNull(reason);
        assertTrue(reason.startsWith("diagnostic"), reason);
    }

    @Test
    void topcitCountsThreeAssessments() {
        long counted = java.util.stream.Stream.of(
                        onLesson(exam(1L, "Management of Software Requirements Quiz", "LESSON_QUIZ"), 1L),
                        onMiddle(exam(2L, "Requirements Engineering Fundamentals Exam", "MIDDLE_EXAM"), 1L),
                        onMajor(exam(3L, "Software Requirements Management Exam", "MAJOR_EXAM"), 1L),
                        exam(4L, "Diagnostic Exam", "DIAGNOSTIC"))
                .filter(exam -> reasonFor(exam) == null)
                .count();
        assertEquals(3, counted);
    }


    @Test
    void excludesAnExamWhoseStatusColumnIsNull() {
        Exam draft = onLesson(exam(5L, "Unpublished quiz", "LESSON_QUIZ"), 1L);
        draft.setStatus(null);
        String reason = reasonFor(draft);
        assertNotNull(reason);
        assertTrue(reason.contains("status column is null"), reason);
    }

    @Test
    void excludesAPracticeDeckThatBelongsToOneLearner() {
        Exam practice = onLesson(exam(9L, "Tutor practice deck", "GENERATED_QUIZ"), 1L);
        Learner owner = new Learner();
        owner.setLearnerId(5L);
        practice.setLearner(owner);
        assertEquals("tutor practice (belongs to a single learner)", reasonFor(practice));
    }

    @Test
    void excludesAPracticeDeckByItsTargetScope() {
        Exam practice = onLesson(exam(10L, "Tutor practice deck", "GENERATED_QUIZ"), 1L);
        practice.setTargetScope(GeneratedAssessmentService.GENERATED_TARGET_SCOPE);
        assertEquals("tutor practice (target scope GENERATED)", reasonFor(practice));
    }

    @Test
    void excludesAPracticeDeckByItsExamType() {
        assertEquals("tutor practice (type GENERATED_FLASHCARD)",
                reasonFor(onLesson(exam(11L, "Flashcards", "GENERATED_FLASHCARD"), 1L)));
    }

    @Test
    void countsACurriculumExamEvenWhenFlaggedGenerated() {
        Exam aiAuthored = onLesson(exam(1L, "Management of Software Requirements Quiz",
                "LESSON_QUIZ"), 1L);
        aiAuthored.setGenerated(true);
        assertNull(reasonFor(aiAuthored));
    }

    @Test
    void excludesAnExamTargetingContentOutsideTheCurriculum() {
        String reason = reasonFor(onLesson(exam(7L, "Institution-only quiz", "LESSON_QUIZ"), 99L));
        assertNotNull(reason);
        assertTrue(reason.contains("targets lesson 99"), reason);
    }

    @Test
    void excludesChallengeArenasEvenWhenTheyTargetTheCurriculum() {
        String reason = reasonFor(onLesson(exam(12L, "World Cup", "CHALLENGE"), 1L));
        assertNotNull(reason);
        assertTrue(reason.contains("not part of the certification curriculum"), reason);
        assertNotNull(reasonFor(exam(13L, "Blueprint Arena", "CHALLENGE")));
    }

    @Test
    void excludesKnowledgeChecks() {
        assertNotNull(reasonFor(onLesson(exam(14L, "Quick check", "KNOWLEDGE_CHECK"), 1L)));
    }

    @Test
    void countsCurriculumExamsSavedUnderOlderTypeNames() {
        assertNull(reasonFor(onLesson(exam(15L, "Legacy quiz", "QUIZ"), 1L)));
        assertNull(reasonFor(onMiddle(exam(16L, "Legacy module exam", "MODULE_EXAM"), 1L)));
        assertNull(reasonFor(exam(17L, "Legacy mock", "MOCK")));
    }

    @Test
    void anUntypedExamIsCountedRatherThanTreatedAsDiagnostic() {
        Exam untyped = onLesson(exam(8L, "Legacy exam", "LESSON_QUIZ"), 1L);
        untyped.setExamType(null);
        assertNull(reasonFor(untyped));
    }
}
