package com.capstone.rebyu.gamification.controller;

import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.gamification.service.StreakService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/streaks")
public class StreakController {
  @Autowired private StreakService streakService;
  @Autowired private RoleGuard guard;

  @GetMapping("/me")
  public ResponseEntity<StreakService.StreakView> getMyStreak(@AuthenticationPrincipal Jwt jwt) {
    var currentUser = guard.requireLearner(jwt);
    return ResponseEntity.ok(streakService.getStreak(currentUser.getLearnerId()));
  }

  @PostMapping("/me/record")
  public ResponseEntity<?> recordActivity(@AuthenticationPrincipal Jwt jwt) {
    var currentUser = guard.requireLearner(jwt);
    streakService.recordActivity(currentUser.getLearnerId());
    return ResponseEntity.ok().build();
  }
}
