package com.capstone.rebyu.gamification.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.gamification.service.StudyPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-plans")
@RequiredArgsConstructor
public class StudyPlanController {

  private final StudyPlanService studyPlanService;
  private final CognitoAuthService auth;

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
