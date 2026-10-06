package com.capstone.rebyu.challenge.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.challenge.service.WorldCupTournamentService;
import com.capstone.rebyu.challenge.service.WorldCupTournamentService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/worldcup")
@RequiredArgsConstructor
public class WorldCupTournamentController {

  private final WorldCupTournamentService tournament;
  private final CognitoAuthService auth;

  @PostMapping("/queue")
  public QueueStatus joinQueue(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody Map<String, Long> body) {
    return tournament.joinQueue(learnerId(jwt), body.get("certificationId"));
  }

  @DeleteMapping("/queue")
  public QueueStatus leaveQueue(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam Long certificationId) {
    return tournament.leaveQueue(learnerId(jwt), certificationId);
  }

  @GetMapping("/queue")
  public QueueStatus queueStatus(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam Long certificationId) {
    return tournament.queueStatus(learnerId(jwt), certificationId);
  }

  @GetMapping("/my-bracket")
  public BracketView myBracket(@AuthenticationPrincipal Jwt jwt) {
    return tournament.getActiveBracketForLearner(learnerId(jwt));
  }

  @GetMapping("/history")
  public java.util.List<Map<String, Object>> history(@AuthenticationPrincipal Jwt jwt) {
    return tournament.getHistory(learnerId(jwt));
  }

  @GetMapping("/brackets/{bracketId}")
  public BracketView bracket(@PathVariable Long bracketId) {
    return tournament.getBracket(bracketId);
  }

  @PostMapping("/matches/{matchId}/score")
  public MatchView reportScore(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable Long matchId,
      @RequestBody Map<String, Object> body) {
    Long attemptId = body.get("attemptId") != null ? ((Number) body.get("attemptId")).longValue() : null;
    double score = body.get("score") != null ? ((Number) body.get("score")).doubleValue() : 0;
    return tournament.reportScore(matchId, learnerId(jwt), attemptId, score);
  }

  // ── TEST ENDPOINTS (remove after testing) ──

  @PostMapping("/test/seed-bots")
  public Map<String, Object> seedBots(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody Map<String, Object> body) {
    learnerId(jwt); // auth check
    Long certificationId = ((Number) body.get("certificationId")).longValue();
    int count = body.get("count") != null ? ((Number) body.get("count")).intValue() : 7;
    return tournament.seedBotPlayers(certificationId, count);
  }

  @PostMapping("/test/bot-scores")
  public Map<String, Object> botScores(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody Map<String, Object> body) {
    Long myId = learnerId(jwt);
    Long bracketId = ((Number) body.get("bracketId")).longValue();
    return tournament.simulateBotScores(bracketId, myId);
  }

  @PostMapping("/test/cleanup")
  public Map<String, String> cleanup(@AuthenticationPrincipal Jwt jwt) {
    learnerId(jwt);
    tournament.cleanupTestData();
    return Map.of("status", "cleaned");
  }

  private Long learnerId(Jwt jwt) {
    if (jwt == null) throw new IllegalArgumentException("Authentication is required");
    CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
    Long id = user.learnerId();
    if (id == null) throw new IllegalArgumentException("A learner account is required");
    return id;
  }
}
