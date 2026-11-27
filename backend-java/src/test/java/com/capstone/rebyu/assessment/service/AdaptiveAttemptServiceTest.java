package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.engine.AdaptiveSessionState;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.adaptive.repository.LearnerBankCycleRepository;
import com.capstone.rebyu.adaptive.service.AdaptivePolicy;
import com.capstone.rebyu.adaptive.service.LearnerAbilityService;
import com.capstone.rebyu.adaptive.service.QuestionBankSizeService;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AttemptAnswerDraftDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.LearnerAttemptQuestionDto;
import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptAnswer;
import com.capstone.rebyu.assessment.entity.AssessmentAttemptQuestion;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptAnswerRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptQuestionRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.assessment.repository.QuestionSelectionView;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdaptiveAttemptServiceTest {

    @Mock private EligibleQuestionService eligibleQuestions;
    @Mock private QuestionRepository questionRepository;
    @Mock private AssessmentAttemptRepository attemptRepository;
    @Mock private AssessmentAttemptService attempts;
    @Mock private LearnerAbilityService abilities;
    @Mock private LearnerBankCycleRepository bankCycles;
    @Mock private AssessmentAttemptQuestionRepository attemptQuestions;
    @Mock private AssessmentAttemptAnswerRepository attemptAnswers;

    @ParameterizedTest
    @ValueSource(strings = {"PROGRAMMING", "DIAGRAM"})
    void gradesSavedWorkspaceDraftAndReplaysRetryWithoutCountingItTwice(String questionType) throws Exception {
        var mapper = new ObjectMapper();
        var properties = new AdaptiveProperties();
        var bank = mock(QuestionBankSizeService.class);
        var service = new AdaptiveAttemptService(attempts, properties, new AdaptivePolicy(properties),
                null, bank, abilities, null, bankCycles, questionRepository, null, attemptRepository,
                attemptQuestions, attemptAnswers, mapper, null);
        var state = new AdaptiveSessionState();
        state.setSe(IrtModel.PRIOR_SIGMA);
        state.setMainCount(2);
        state.setTargetCount(2);
        state.setServedCount(2);
        state.getServedQuestionIds().addAll(List.of(10L, 11L));
        state.getQueuedAttemptQuestionIds().add(102L);
        var exam = Exam.builder().examId(1L).releaseAnswersAfterSubmit(false).build();
        var attempt = AssessmentAttempt.builder().assessmentAttemptId(2L).exam(exam)
                .status(AssessmentAttempt.Status.IN_PROGRESS).adaptive(true)
                .currentQuestionId(101L).adaptiveStateJson(mapper.writeValueAsString(state)).build();
        var item = AssessmentAttemptQuestion.builder().attemptQuestionId(101L).attempt(attempt)
                .sourceQuestionId(10L).displayOrder(1).questionType(questionType).build();
        var next = AssessmentAttemptQuestion.builder().attemptQuestionId(102L).attempt(attempt)
                .sourceQuestionId(11L).displayOrder(2).questionType("MULTIPLE_CHOICE").build();
        var source = Question.builder().questionId(10L).questionType(questionType)
                .difficultyLevel("AVERAGE").build();
        boolean programming = "PROGRAMMING".equals(questionType);
        var savedDraft = AssessmentAttemptAnswer.builder().attemptAnswerId(3L).attempt(attempt).attemptQuestion(item)
                .submittedCode(programming ? "print(1)" : null).programmingLanguage(programming ? "python" : null)
                .diagramSubmissionData(programming ? null : "{\"cells\":[]}").build();
        var submitted = new AttemptAnswerDraftDto(101L, null, null,
                programming ? "print(2)" : null, programming ? "python" : null,
                programming ? null : "{\"cells\":[{\"id\":\"updated\"}]}");

        when(attempts.requireOwnedAttempt(2L, 4L)).thenReturn(attempt);
        when(attemptQuestions.findAllById(List.of(101L))).thenReturn(List.of(item));
        when(attemptQuestions.findById(102L)).thenReturn(Optional.of(next));
        var nextDto = mock(LearnerAttemptQuestionDto.class);
        when(nextDto.attemptQuestionId()).thenReturn(102L);
        when(attempts.toLearnerQuestion(next)).thenReturn(nextDto);
        when(attemptAnswers.findByAttempt_AssessmentAttemptIdAndAttemptQuestion_AttemptQuestionId(2L, 101L))
                .thenReturn(Optional.of(savedDraft));
        when(attemptAnswers.save(any())).thenAnswer(returnsFirstArg());
        when(attempts.hasAnswerContent(submitted)).thenReturn(true);
        when(questionRepository.findForAttemptByIdIn(List.of(10L))).thenReturn(List.of(source));
        when(attempts.buildSnapshotContext(List.of(source)))
                .thenReturn(AssessmentAttemptService.SnapshotContext.empty());
        when(attempts.scoreOf(item, savedDraft)).thenReturn(1.0);
        doAnswer(call -> {
            AssessmentAttemptAnswer answer = call.getArgument(1);
            answer.setIsCorrect(true);
            answer.setCredit(BigDecimal.ONE);
            return null;
        }).when(attempts).scoreAnswer(same(item), same(savedDraft), any(), any(), any());

        var checked = service.answer(2L, 4L, submitted);
        assertEquals(submitted.submittedCode(), savedDraft.getSubmittedCode());
        assertEquals(submitted.diagramSubmissionData(), savedDraft.getDiagramSubmissionData());
        assertEquals(1, checked.progress().answered());
        assertEquals(102L, checked.next().attemptQuestionId());
        assertTrue(checked.verdict().isCorrect());

        var retry = service.answer(2L, 4L, submitted);
        assertEquals(checked.progress(), retry.progress());
        assertEquals(checked.verdict(), retry.verdict());
        assertEquals(102L, retry.next().attemptQuestionId());
        verify(attemptAnswers, times(2)).save(same(savedDraft));
        verify(attempts).scoreAnswer(same(item), same(savedDraft), any(), any(), any());
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void adaptsDifficultyAndFinishesTwentyItemsWithoutCountingReusedQuestionsAsIrtEvidence(boolean correct) {
        var properties = new AdaptiveProperties();
        var policy = new AdaptivePolicy(properties);
        var bank = new QuestionBankSizeService(eligibleQuestions, policy, properties);
        var service = new AdaptiveAttemptService(attempts, properties, policy, null, bank, abilities, null, bankCycles,
                questionRepository, null, attemptRepository, attemptQuestions, attemptAnswers, new ObjectMapper(),
                new AssessmentTimerService(mock(org.springframework.jdbc.core.JdbcTemplate.class), null));
        var certification = new Certification();
        certification.setCertificationId(2L);
        var exam = Exam.builder().examId(1L)
                .examType(ExamType.builder().examTypeText("MIDDLE_EXAM").build())
                .certification(certification)
                .releaseAnswersAfterSubmit(false)
                .build();

        var lesson = new Lesson();
        lesson.setLessonId(3L);
        List<QuestionSelectionView> views = new ArrayList<>();
        Map<Long, Question> bankQuestions = new LinkedHashMap<>();
        for (long id = 1; id <= 12; id++) {
            String text = "Question " + id;
            String difficulty = id == 1 ? "AVERAGE" : id <= 6 ? "EASY" : "HARD";
            views.add(question(id, text, difficulty));
            bankQuestions.put(id, Question.builder().questionId(id).questionType("MULTIPLE_CHOICE")
                    .questionText(text).difficultyLevel(difficulty).lesson(lesson).build());
        }
        when(eligibleQuestions.resolveScopeViews(2L, null, null, null)).thenReturn(views);
        when(questionRepository.findForAttemptByIdIn(any())).thenAnswer(call ->
                call.<List<Long>>getArgument(0).stream().map(bankQuestions::get).toList());
        when(abilities.seed(1L, 2L, Map.of(3L, 12)))
                .thenReturn(new LearnerAbilityService.Seed(0.0, IrtModel.PRIOR_SIGMA, Map.of(), Map.of()));
        when(bankCycles.save(any())).thenAnswer(returnsFirstArg());
        when(attemptRepository.save(any())).thenAnswer(call -> {
            AssessmentAttempt attempt = call.getArgument(0);
            attempt.setAssessmentAttemptId(1L);
            return attempt;
        });
        Map<Long, AssessmentAttemptQuestion> served = new LinkedHashMap<>();
        when(attemptQuestions.save(any())).thenAnswer(call -> {
            AssessmentAttemptQuestion item = call.getArgument(0);
            long itemId = item.getDisplayOrder().longValue();
            item.setAttemptQuestionId(itemId);
            served.put(itemId, item);
            return item;
        });
        when(attemptQuestions.findAllById(any())).thenAnswer(call ->
                StreamSupport.stream(call.<Iterable<Long>>getArgument(0).spliterator(), false)
                        .map(served::get).toList());
        when(attempts.toLearnerQuestion(any())).thenAnswer(call -> {
            AssessmentAttemptQuestion item = call.getArgument(0);
            var dto = mock(LearnerAttemptQuestionDto.class);
            when(dto.attemptQuestionId()).thenReturn(item.getAttemptQuestionId());
            return dto;
        });
        when(attemptAnswers.save(any())).thenAnswer(returnsFirstArg());
        when(attempts.hasAnswerContent(any())).thenReturn(true);
        when(attempts.scoreOf(any(), any())).thenReturn(correct ? 1.0 : 0.0);

        AssessmentAttempt attempt = service.start(exam, 1L, 1, "key");
        assertEquals(attempt.getStartedAt().plusMinutes(30), attempt.getExpiresAt());
        when(attempts.requireOwnedAttempt(1L, 1L)).thenReturn(attempt);
        assertEquals(20, service.progressOf(attempt).total());
        assertEquals(1L, served.get(1L).getSourceQuestionId().longValue());
        for (long position = 1; position <= 20; position++) {
            assertEquals(position, attempt.getCurrentQuestionId().longValue());
            var answer = new AttemptAnswerDraftDto(position, "answer", null, null, null, null);
            var response = service.answer(1L, 1L, answer);
            assertEquals(position, response.progress().answered());
            assertEquals(20, response.progress().total());
            assertEquals(position == 20, response.completed());
            if (position == 1) {
                double theta = attempt.getThetaCurrent();
                assertTrue(correct ? theta > 0.0 : theta < 0.0);
                assertTrue(attempt.getThetaSe() < IrtModel.PRIOR_SIGMA);
                var next = served.get(2L);
                assertEquals(theta, next.getThetaBefore(), 1e-9);
                assertEquals(correct ? "HARD" : "EASY",
                        bankQuestions.get(next.getSourceQuestionId()).getDifficultyLevel());
            }
        }

        verify(attempts, times(20)).scoreAnswer(any(), any(), any(), any(), any());
        verify(attempts, times(12)).scoreOf(any(), any());
        assertEquals(served.get(12L).getThetaAfter().doubleValue(), attempt.getThetaCurrent(), 1e-9);
        List<Long> sources = served.values().stream().map(AssessmentAttemptQuestion::getSourceQuestionId).toList();
        assertEquals(20, sources.size());
        assertEquals(12, sources.subList(0, 12).stream().distinct().count());
        assertEquals(8, sources.subList(12, 20).stream().distinct().count());
        assertNotEquals(sources.get(11), sources.get(12));
    }

    private static QuestionSelectionView question(long id, String text, String difficulty) {
        var question = mock(QuestionSelectionView.class);
        when(question.getOwnerDepartmentId()).thenReturn(null);
        when(question.getQuestionId()).thenReturn(id);
        when(question.getLessonId()).thenReturn(3L);
        when(question.getQuestionType()).thenReturn("MULTIPLE_CHOICE");
        when(question.getQuestionText()).thenReturn(text);
        when(question.getDifficultyLevel()).thenReturn(difficulty);
        return question;
    }
}
