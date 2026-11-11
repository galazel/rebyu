package com.capstone.rebyu.challenge.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.challenge.service.ChallengeArenaService;
import com.capstone.rebyu.challenge.service.WorldCupEditionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/challenge-arenas")
@RequiredArgsConstructor
public class ChallengeArenaController {

  private final ChallengeArenaService arenas;
  private final WorldCupEditionService worldCupEditions;
  private final CognitoAuthService auth;

  @GetMapping
  public List<ChallengeArenaService.ArenaStatus> statuses() {
    return arenas.statuses();
  }

  @GetMapping("/{arenaId}")
  public ChallengeArenaService.ArenaStatus status(@PathVariable String arenaId) {
    return arenas.status(arenaId);
  }

  @PutMapping("/{arenaId}/problems")
  public ChallengeArenaService.ArenaStatus saveProblems(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String arenaId,
      @RequestBody ChallengeArenaService.SaveArenaProblemsRequest request) {
    requireAdmin(jwt);
    return arenas.saveProblems(arenaId, request);
  }

  @GetMapping("/{arenaId}/problems")
  public List<ChallengeArenaService.ArenaProblemView> problems(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String arenaId) {
    requireAdmin(jwt);
    return arenas.problems(arenaId);
  }

  @PutMapping("/{arenaId}/settings")
  public ChallengeArenaService.ArenaStatus saveSettings(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String arenaId,
      @RequestBody Map<String, Integer> settings) {
    requireAdmin(jwt);
    return arenas.saveSettings(arenaId, settings);
  }

  @PutMapping("/{arenaId}/live")
  public ChallengeArenaService.ArenaStatus setLive(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String arenaId,
      @RequestBody SetLiveRequest request) {
    requireAdmin(jwt);
    if (request == null || request.live() == null) {
      throw new IllegalArgumentException("Say whether the arena is live");
    }
    return arenas.setLive(arenaId, request.live());
  }

  public record SetLiveRequest(Boolean live) {}

  @PutMapping("/{arenaId}/certifications")
  public ChallengeArenaService.ArenaStatus assignCertifications(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String arenaId,
      @RequestBody AssignRequest request) {
    requireAdmin(jwt);
    return arenas.setAssignedCertifications(arenaId, request == null ? List.of() : request.certificationIds());
  }

  public record AssignRequest(List<Long> certificationIds) {}

  /** The challenges a certification's learners see on their learning path. */
  @GetMapping("/for-certification/{certificationId}")
  public List<ChallengeArenaService.ArenaStatus> forCertification(@PathVariable Long certificationId) {
    return arenas.forCertification(certificationId);
  }

  @PutMapping("/worldcup/tracks")
  public ChallengeArenaService.ArenaStatus setDisabledTracks(
      @AuthenticationPrincipal Jwt jwt, @RequestBody SetTracksRequest request) {
    requireAdmin(jwt);
    return arenas.setDisabledTracks(request == null ? List.of() : request.disabledCertificationIds());
  }

  public record SetTracksRequest(List<Long> disabledCertificationIds) {}


  /** The signed-in learner's handed-in problems for an arena; the next one unlocks. */
  @GetMapping("/{arenaId}/my-progress")
  public MyProgress myProgress(@AuthenticationPrincipal Jwt jwt, @PathVariable String arenaId) {
    if (jwt == null) {
      throw new IllegalArgumentException("Authentication is required");
    }
    CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
    List<Long> ids = arenas.completedProblemIds(arenaId, user.learnerId());
    return new MyProgress(ids, arenas.completedStageIndexes(arenaId, ids));
  }

  public record MyProgress(List<Long> completedQuestionIds, List<Integer> completedStageIndexes) {}

  /** The weekly exam learners can play now; `edition` is null when none is published. */
  @GetMapping("/worldcup/active-edition")
  public ActiveEditionResponse activeEdition() {
    return new ActiveEditionResponse(arenas.activeWorldCupEdition().orElse(null));
  }

  public record ActiveEditionResponse(ChallengeArenaService.ActiveEdition edition) {}

  @GetMapping("/worldcup/editions")
  public List<WorldCupEditionService.EditionSummary> editions(@AuthenticationPrincipal Jwt jwt) {
    requireAdmin(jwt);
    return worldCupEditions.list();
  }

  @GetMapping("/worldcup/editions/{editionId}")
  public WorldCupEditionService.EditionDetail edition(
      @AuthenticationPrincipal Jwt jwt, @PathVariable Long editionId) {
    requireAdmin(jwt);
    return worldCupEditions.detail(editionId);
  }

  @PostMapping("/worldcup/editions")
  public WorldCupEditionService.EditionSummary createEdition(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody WorldCupEditionService.CreateEditionRequest request) {
    requireAdmin(jwt);
    return worldCupEditions.create(request);
  }

  @PutMapping("/worldcup/editions/{editionId}/stages")
  public WorldCupEditionService.EditionSummary saveEditionStages(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable Long editionId,
      @RequestBody WorldCupEditionService.SaveStagesRequest request) {
    requireAdmin(jwt);
    return worldCupEditions.saveStages(editionId, request);
  }

  @PostMapping("/worldcup/editions/{editionId}/publish")
  public WorldCupEditionService.EditionSummary publishEdition(
      @AuthenticationPrincipal Jwt jwt, @PathVariable Long editionId) {
    requireAdmin(jwt);
    return worldCupEditions.publish(editionId);
  }

  @DeleteMapping("/worldcup/editions/{editionId}")
  public void deleteEdition(@AuthenticationPrincipal Jwt jwt, @PathVariable Long editionId) {
    requireAdmin(jwt);
    worldCupEditions.delete(editionId);
  }

  @DeleteMapping("/{arenaId}/problems")
  public ChallengeArenaService.ArenaStatus clearProblems(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String arenaId) {
    requireAdmin(jwt);
    return arenas.clearProblems(arenaId);
  }

  private void requireAdmin(Jwt jwt) {
    if (jwt == null) {
      throw new IllegalArgumentException("Authentication is required");
    }
    CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
    if (!"ADMIN".equalsIgnoreCase(user.role())) {
      throw new IllegalArgumentException("Admin access is required");
    }
  }
}
