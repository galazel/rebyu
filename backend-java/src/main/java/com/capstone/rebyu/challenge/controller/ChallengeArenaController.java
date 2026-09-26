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

/**
 * Arena configuration, and the status the learner's view locks against.
 *
 * <p>Reading is open to any signed-in user: the learner's challenge cards need
 * to know which arenas are ready, and "this arena has eight problems" gives
 * away nothing about them. Writing is admin-only -- configuring an arena
 * decides what every learner sits.
 */
@RestController
@RequestMapping("/api/challenge-arenas")
@RequiredArgsConstructor
public class ChallengeArenaController {

  private final ChallengeArenaService arenas;
  private final WorldCupEditionService worldCupEditions;
  private final CognitoAuthService auth;

  /** Every arena and whether it is ready to run. */
  @GetMapping
  public List<ChallengeArenaService.ArenaStatus> statuses() {
    return arenas.statuses();
  }

  @GetMapping("/{arenaId}")
  public ChallengeArenaService.ArenaStatus status(@PathVariable String arenaId) {
    return arenas.status(arenaId);
  }

  /**
   * Replaces an arena's problems.
   *
   * <p>The questions themselves are already in the bank by this point -- the
   * builder saves them through the same endpoints the question bank uses, so an
   * arena problem is an ordinary question and is validated as one. This records
   * only which of them the arena runs, and in what order.
   */
  @PutMapping("/{arenaId}/problems")
  public ChallengeArenaService.ArenaStatus saveProblems(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String arenaId,
      @RequestBody ChallengeArenaService.SaveArenaProblemsRequest request) {
    requireAdmin(jwt);
    return arenas.saveProblems(arenaId, request);
  }

  /**
   * The arena's saved problem set, with each question's parts, for the admin
   * builder to reload. Admin-only: unlike the status, this is the answers.
   */
  @GetMapping("/{arenaId}/problems")
  public List<ChallengeArenaService.ArenaProblemView> problems(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String arenaId) {
    requireAdmin(jwt);
    return arenas.problems(arenaId);
  }

  /** Replaces an arena's run settings (node count, time limit, weights, ...). */
  @PutMapping("/{arenaId}/settings")
  public ChallengeArenaService.ArenaStatus saveSettings(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String arenaId,
      @RequestBody Map<String, Integer> settings) {
    requireAdmin(jwt);
    return arenas.saveSettings(arenaId, settings);
  }

  /** Opens or pauses an arena for learners; its problems are kept either way. */
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

  /** Replaces the certifications switched off as World Cup tracks. */
  @PutMapping("/worldcup/tracks")
  public ChallengeArenaService.ArenaStatus setDisabledTracks(
      @AuthenticationPrincipal Jwt jwt, @RequestBody SetTracksRequest request) {
    requireAdmin(jwt);
    return arenas.setDisabledTracks(request == null ? List.of() : request.disabledCertificationIds());
  }

  public record SetTracksRequest(List<Long> disabledCertificationIds) {}

  // World Cup weekly editions. All admin-only: a draft week is next week's
  // answers, and publishing one decides what every learner sits.

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

  /** Empties an arena, which locks it again for learners. */
  @DeleteMapping("/{arenaId}/problems")
  public ChallengeArenaService.ArenaStatus clearProblems(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String arenaId) {
    requireAdmin(jwt);
    return arenas.clearProblems(arenaId);
  }

  /**
   * Admin only, and deliberately not "admin or institution".
   *
   * <p>The question bank lets an institution author its own questions because
   * those are scoped to that institution's own learners. An arena is not: it is
   * one shared surface every learner on the platform enters, so an institution
   * configuring it would be choosing what everyone else sits.
   */
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
