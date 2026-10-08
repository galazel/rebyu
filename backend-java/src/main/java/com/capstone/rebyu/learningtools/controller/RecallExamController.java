package com.capstone.rebyu.learningtools.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.learningtools.service.RecallExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recall-sessions")
@RequiredArgsConstructor
public class RecallExamController {

  private final RecallExamService recallExamService;
  private final CognitoAuthService auth;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public RecallExamService.RecallExam create(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody CreateRecallRequest request) {
    if ("mock".equalsIgnoreCase(request.mode())) {
      return recallExamService.createPlanMockExam(me(jwt), request.certificationId(), request.size());
    }
    return recallExamService.createRecallExam(
        me(jwt), request.certificationId(), request.lessonId(), request.size());
  }

  public record CreateRecallRequest(Long certificationId, Long lessonId, Integer size, String mode) {}

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
