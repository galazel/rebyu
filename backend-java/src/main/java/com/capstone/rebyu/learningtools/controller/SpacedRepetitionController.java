package com.capstone.rebyu.learningtools.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.learningtools.service.SpacedRepetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/review-sessions")
@RequiredArgsConstructor
public class SpacedRepetitionController {

  private final SpacedRepetitionService reviews;
  private final CognitoAuthService auth;

  @PostMapping("/due")
  public SpacedRepetitionService.ReviewQueue due(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody DueRequest request) {
    return reviews.dueCards(me(jwt), request.certificationId(), request.lessonId(), request.size());
  }

  @PutMapping("/items/{questionId}/grade")
  public SpacedRepetitionService.ReviewOutcome grade(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable Long questionId,
      @RequestBody GradeRequest request) {
    return reviews.grade(me(jwt), questionId, request.grade());
  }

  public record DueRequest(Long certificationId, Long lessonId, Integer size) {}

  public record GradeRequest(String grade) {}

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
