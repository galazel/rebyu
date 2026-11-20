package com.capstone.rebyu.gamification.controller;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.dto.StudyPlanNoteDtos;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException;
import com.capstone.rebyu.billing.service.AiGenerationQuotaService;
import com.capstone.rebyu.gamification.service.StudyPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-plans")
@RequiredArgsConstructor
@Slf4j
public class StudyPlanController {

  private final StudyPlanService studyPlanService;
  private final CognitoAuthService auth;
  private final AiServiceClient ai;
  private final AiGenerationQuotaService generationQuota;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public StudyPlanService.StudyPlanDto save(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody StudyPlanService.SavePlanRequest request) {
    return studyPlanService.savePlan(me(jwt), request);
  }

  @GetMapping("/me/active")
  public StudyPlanService.StudyPlanDto active(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) Long certificationId,
      @RequestParam(required = false) String scope) {
    Long learnerId = me(jwt);
    return "overall".equalsIgnoreCase(scope)
        ? studyPlanService.overallPlan(learnerId)
        : studyPlanService.activePlan(learnerId, certificationId);
  }

  @DeleteMapping("/me/active")
  public java.util.Map<String, Integer> clearActive(@AuthenticationPrincipal Jwt jwt) {
    return java.util.Map.of("cleared", studyPlanService.clearActivePlans(me(jwt)));
  }

  @GetMapping("/my-plans")
  public List<StudyPlanService.StudyPlanDto> myPlans(@AuthenticationPrincipal Jwt jwt) {
    return studyPlanService.getUserPlans(me(jwt));
  }

  @GetMapping("/me/tasks")
  public List<StudyPlanService.TaskStatusDto> taskStatuses(@AuthenticationPrincipal Jwt jwt) {
    return studyPlanService.taskStatuses(me(jwt));
  }

  @PutMapping("/{planId}/tasks/{eventId}/status")
  public StudyPlanService.TaskStatusDto setTaskStatus(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable Long planId,
      @PathVariable String eventId,
      @RequestBody TaskStatusRequest request) {
    return studyPlanService.setTaskStatus(me(jwt), planId, eventId, request.status());
  }

  public record TaskStatusRequest(String status) {}

  @PostMapping("/{planId}/complete")
  public ResponseEntity<Void> complete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long planId) {
    studyPlanService.completePlan(planId, me(jwt));
    return ResponseEntity.ok().build();
  }

  /**
   * Reads the learner's "anything else" note into schedule rules.
   *
   * <p>The calendar is still built in the browser from these rules, so the model only ever
   * says when to study -- never what the plan contains. An empty note costs nothing: it
   * returns at once without a model call, and so without spending the learner's AI uses.
   */
  @PostMapping("/read-note")
  public StudyPlanNoteDtos.Rules readNote(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody StudyPlanNoteDtos.Request request) {
    Long learnerId = me(jwt);
    if (request == null || request.note() == null || request.note().isBlank()) {
      return StudyPlanNoteDtos.Rules.empty();
    }
    try {
      return generationQuota.authorizeTutor(
          learnerId,
          AiGenerationQuotaService.KIND_STUDY_PLAN_NOTE,
          () -> ai.readStudyPlanNote(request));
    } catch (PremiumAccessRequiredException noAccess) {
      // No AI access, or no uses left today: the note is ignored, not half-read.
      return StudyPlanNoteDtos.Rules.unavailable(noAccess.getMessage());
    } catch (RuntimeException unavailable) {
      log.warn("Could not read a study-plan note for learner {}: {}", learnerId, unavailable.toString());
      return StudyPlanNoteDtos.Rules.unavailable(
          "Your note could not be read just now, so it was left out of this plan.");
    }
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
}
