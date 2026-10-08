package com.capstone.rebyu.bkt.controller;

import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.bkt.dto.ConfidenceView;
import com.capstone.rebyu.bkt.dto.LearnerMasteryView;
import com.capstone.rebyu.bkt.dto.LessonPriorityView;
import com.capstone.rebyu.bkt.dto.MasteryHistoryView;
import com.capstone.rebyu.bkt.service.LearnerMasteryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bkt")
@RequiredArgsConstructor
public class BKTController {

  private final LearnerMasteryService learnerMasteryService;
  private final RoleGuard guard;

  @GetMapping("/me/confidence/{certificationId}")
  public ResponseEntity<ConfidenceView> getMyConfidence(
      @PathVariable Long certificationId,
      @AuthenticationPrincipal Jwt jwt) {
    var currentUser = guard.requireLearner(jwt);
    var result = learnerMasteryService.getConfidenceForAnalytics(currentUser.getLearnerId(), certificationId);
    return result.available() && result.confidence() != null
        ? ResponseEntity.ok(result.confidence())
        : ResponseEntity.notFound().build();
  }

  @GetMapping("/me/lessons/{certificationId}")
  public ResponseEntity<List<LessonPriorityView>> getMyLessonPriorities(
      @PathVariable Long certificationId,
      @AuthenticationPrincipal Jwt jwt) {
    var currentUser = guard.requireLearner(jwt);
    var result = learnerMasteryService.getLessonPrioritiesForAnalytics(currentUser.getLearnerId(), certificationId);
    return ResponseEntity.ok(result.lessons());
  }

  @GetMapping("/me/history/{certificationId}")
  public ResponseEntity<List<MasteryHistoryView>> getMyMasteryHistory(
      @PathVariable Long certificationId,
      @AuthenticationPrincipal Jwt jwt) {
    var currentUser = guard.requireLearner(jwt);
    var result = learnerMasteryService.getMasteryHistoryForAnalytics(currentUser.getLearnerId(), certificationId);
    return ResponseEntity.ok(result.history());
  }

  @GetMapping("/me/mastery")
  public ResponseEntity<LearnerMasteryView> getMyMastery(
      @RequestParam(required = false) List<Long> lessonIds,
      @AuthenticationPrincipal Jwt jwt) {
    var currentUser = guard.requireLearner(jwt);
    LearnerMasteryView mastery = learnerMasteryService.getMastery(currentUser.getLearnerId(), lessonIds);
    return mastery.items().isEmpty()
        ? ResponseEntity.noContent().build()
        : ResponseEntity.ok(mastery);
  }

  @GetMapping("/me/confidence-map/{certificationId}")
  public ResponseEntity<Map<String, Object>> getMyConfidenceMap(
      @PathVariable Long certificationId,
      @AuthenticationPrincipal Jwt jwt) {
    var currentUser = guard.requireLearner(jwt);
    Map<String, Object> confidenceMap = learnerMasteryService.getConfidence(currentUser.getLearnerId(), certificationId);
    return ResponseEntity.ok(confidenceMap);
  }
}
