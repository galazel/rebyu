package com.capstone.rebyu.assessment.controller;

import com.capstone.rebyu.assessment.dto.attempt.DiagramAttemptDtos.*;
import com.capstone.rebyu.assessment.dto.attempt.ChoiceCheckDtos.*;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.*;
import com.capstone.rebyu.assessment.dto.attempt.ProgrammingAttemptDtos.*;
import com.capstone.rebyu.assessment.service.AdaptiveAttemptService;
import com.capstone.rebyu.assessment.service.AssessmentAttemptService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learner")
@RequiredArgsConstructor
public class LearnerAssessmentController {

    private final AssessmentAttemptService assessmentAttemptService;
    private final AdaptiveAttemptService adaptiveAttemptService;
    private final CognitoAuthService auth;
    private final com.capstone.rebyu.assessment.repository.ExamRepository examRepository;
    private final com.capstone.rebyu.department.repository.DepartmentLearnerRepository groupAssignees;

    private void requireClassMemberIfGroupExam(Long assessmentId, Long learnerId) {
        examRepository.findById(assessmentId).ifPresent(exam -> {
            if (exam.getOwnerDepartment() != null && !groupAssignees
                    .existsByDepartment_DepartmentIdAndInstitutionCertLearner_Learner_LearnerIdAndStatus(
                            exam.getOwnerDepartment().getDepartmentId(), learnerId,
                            com.capstone.rebyu.department.entity.DepartmentLearner.Status.active)) {
                throw new jakarta.persistence.EntityNotFoundException("Assessment not found: " + assessmentId);
            }
        });
    }

    private Long me(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) {
            throw new IllegalArgumentException("A learner account is required");
        }
        return user.learnerId();
    }

    @GetMapping("/assessments/{assessmentId}")
    public LearnerAssessmentDto getAssessment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long assessmentId,
            @RequestParam(required = false) Long learnerId) {
        Long caller = me(jwt);
        requireClassMemberIfGroupExam(assessmentId, caller);
        return assessmentAttemptService.getLearnerAssessment(assessmentId, caller);
    }

    @PostMapping("/assessments/{assessmentId}/attempts")
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentAttemptStartResponseDto startAttempt(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long assessmentId,
            @Valid @RequestBody AssessmentAttemptStartRequestDto request) {
        Long learnerId = me(jwt);
        requireClassMemberIfGroupExam(assessmentId, learnerId);
        return assessmentAttemptService.startAttempt(
                assessmentId, learnerId, request.idempotencyKey(), request.questionIndex(), request.matchId());
    }

    @PutMapping("/assessment-attempts/{attemptId}/answers")
    public void autosaveAnswers(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long attemptId,
            @Valid @RequestBody AutosaveAnswersRequestDto request) {
        assessmentAttemptService.autosaveAnswers(attemptId,
                new AutosaveAnswersRequestDto(me(jwt), request.answers()));
    }

    @PutMapping("/assessment-attempts/{attemptId}/flags/{attemptQuestionId}")
    public void setFlag(
            @PathVariable Long attemptId,
            @PathVariable Long attemptQuestionId,
            @Valid @RequestBody FlagRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {
        assessmentAttemptService.setFlag(
                attemptId, attemptQuestionId, me(jwt), request.flagged());
    }

    @PutMapping("/assessment-attempts/{attemptId}/skip/{attemptQuestionId}")
    public void setSkip(
            @PathVariable Long attemptId,
            @PathVariable Long attemptQuestionId,
            @Valid @RequestBody SkipRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {
        assessmentAttemptService.setSkip(
                attemptId, attemptQuestionId, me(jwt), request.skipped());
    }

    @PutMapping("/assessment-attempts/{attemptId}/current-item")
    public void setCurrentItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long attemptId,
            @Valid @RequestBody CurrentItemRequestDto request) {
        assessmentAttemptService.setCurrentItem(
                attemptId, request.attemptQuestionId(), me(jwt));
    }

    @PostMapping("/assessment-attempts/{attemptId}/programming/{attemptQuestionId}/run")
    public ExecutionResultDto runProgramming(
            @PathVariable Long attemptId,
            @PathVariable Long attemptQuestionId,
            @Valid @RequestBody ProgrammingRunRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {
        return assessmentAttemptService.runProgramming(attemptId, attemptQuestionId,
                new ProgrammingRunRequestDto(me(jwt), request.code(), request.language()));
    }

    @PostMapping("/assessment-attempts/{attemptId}/programming/{attemptQuestionId}/check")
    public ExecutionResultDto checkProgramming(
            @PathVariable Long attemptId,
            @PathVariable Long attemptQuestionId,
            @Valid @RequestBody ProgrammingRunRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {
        return assessmentAttemptService.checkProgramming(attemptId, attemptQuestionId,
                new ProgrammingRunRequestDto(me(jwt), request.code(), request.language()));
    }

    @GetMapping("/assessment-attempts/{attemptId}/programming/{attemptQuestionId}/executions")
    public List<ExecutionHistoryItemDto> listExecutions(
            @PathVariable Long attemptId,
            @PathVariable Long attemptQuestionId,
            @RequestParam(required = false) Long learnerId,
            @AuthenticationPrincipal Jwt jwt) {
        return assessmentAttemptService.listExecutions(attemptId, attemptQuestionId, me(jwt));
    }

    @PostMapping("/assessment-attempts/{attemptId}/diagram/{attemptQuestionId}/check")
    public DiagramCheckResultDto checkDiagram(
            @PathVariable Long attemptId,
            @PathVariable Long attemptQuestionId,
            @Valid @RequestBody DiagramCheckRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {
        return assessmentAttemptService.checkDiagram(attemptId, attemptQuestionId,
                new DiagramCheckRequestDto(
                        me(jwt), request.diagramData(), request.diagramType()));
    }

    @PostMapping("/assessment-attempts/{attemptId}/choice/{attemptQuestionId}/check")
    public ChoiceCheckResultDto checkChoice(
            @PathVariable Long attemptId,
            @PathVariable Long attemptQuestionId,
            @Valid @RequestBody ChoiceCheckRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {
        return assessmentAttemptService.checkChoice(attemptId, attemptQuestionId,
                new ChoiceCheckRequestDto(me(jwt), request.selectedChoiceId()));
    }

    @PostMapping("/assessment-attempts/{attemptId}/adaptive/answer")
    public AdaptiveAnswerResponseDto answerAdaptive(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long attemptId,
            @Valid @RequestBody AdaptiveAnswerRequestDto request) {
        return adaptiveAttemptService.answer(attemptId, me(jwt), request.answer());
    }

    @PostMapping("/assessment-attempts/{attemptId}/adaptive/answers")
    public AdaptiveAnswersResponseDto answerAdaptiveAll(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long attemptId,
            @Valid @RequestBody AdaptiveAnswersRequestDto request) {
        return adaptiveAttemptService.answerAll(attemptId, me(jwt), request.answers());
    }

    @PostMapping("/assessment-attempts/{attemptId}/submit")
    public AssessmentAttemptResultDto submitAttempt(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long attemptId,
            @Valid @RequestBody SubmitAssessmentAttemptRequestDto request) {
        return assessmentAttemptService.submitAttempt(attemptId,
                new SubmitAssessmentAttemptRequestDto(me(jwt), request.answers()));
    }

    @GetMapping("/assessment-attempts")
    public java.util.List<java.util.Map<String, Object>> listAttempts(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long learnerId) {
        return assessmentAttemptService.listAttempts(me(jwt));
    }

    @GetMapping("/assessments/{assessmentId}/attempts")
    public List<AttemptSummaryDto> listAttemptsForAssessment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long assessmentId,
            @RequestParam(required = false) Long learnerId) {
        return assessmentAttemptService.listAttemptsForAssessment(assessmentId, me(jwt));
    }

    @GetMapping("/assessment-attempts/{attemptId}/result")
    public AssessmentAttemptResultDto getResult(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long attemptId,
            @RequestParam(required = false) Long learnerId) {
        return assessmentAttemptService.getResult(attemptId, me(jwt));
    }
}
