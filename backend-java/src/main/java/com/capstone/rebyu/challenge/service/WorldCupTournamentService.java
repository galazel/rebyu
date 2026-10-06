package com.capstone.rebyu.challenge.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.challenge.entity.ChallengeArenaConfig;
import com.capstone.rebyu.challenge.entity.WorldCupBracket;
import com.capstone.rebyu.challenge.entity.WorldCupMatch;
import com.capstone.rebyu.challenge.entity.WorldCupQueue;
import com.capstone.rebyu.challenge.repository.ChallengeArenaConfigRepository;
import com.capstone.rebyu.challenge.repository.WorldCupBracketRepository;
import com.capstone.rebyu.challenge.repository.WorldCupEditionRepository;
import com.capstone.rebyu.challenge.repository.WorldCupMatchRepository;
import com.capstone.rebyu.challenge.repository.WorldCupQueueRepository;
import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeRecord;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorldCupTournamentService {

  private static final String ARENA_ID = "worldcup";
  private static final ObjectMapper JSON = new ObjectMapper();

  private static final String ROUND_QF = "QUARTERFINAL";
  private static final String ROUND_SF = "SEMIFINAL";
  private static final String ROUND_FINAL = "FINAL";
  private static final String ROUND_COMPLETED = "COMPLETED";

  private static final String STATUS_WAITING = "WAITING";
  private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
  private static final String STATUS_COMPLETED = "COMPLETED";

  /** nodeIndex in the exam's question layout: 1=QF, 2=SF, 3=Final */
  private static final Map<String, Integer> ROUND_NODE = Map.of(
      ROUND_QF, 1,
      ROUND_SF, 2,
      ROUND_FINAL, 3
  );

  private static final List<String> ROUND_ORDER = List.of(ROUND_QF, ROUND_SF, ROUND_FINAL);

  private final WorldCupQueueRepository queueRepo;
  private final WorldCupBracketRepository bracketRepo;
  private final WorldCupMatchRepository matchRepo;
  private final WorldCupEditionRepository editionRepo;
  private final ChallengeArenaConfigRepository arenaConfigRepo;
  private final ExamRepository examRepo;
  private final ExamQuestionRepository examQuestionRepo;
  private final AssessmentAttemptRepository attemptRepo;
  private final LearnerRepository learnerRepo;
  private final ChallengeStandingsService standingsService;

  // ──────────────────────────────────────────────
  // DTOs
  // ──────────────────────────────────────────────

  public record QueueStatus(
      boolean inQueue,
      int queueSize,
      int required,
      Long certificationId,
      BracketView activeBracket
  ) {}

  public record BracketView(
      Long bracketId,
      String currentRound,
      List<PlayerInfo> players,
      List<MatchView> matches,
      Long winnerLearnerId,
      LocalDateTime createdAt
  ) {}

  public record MatchView(
      Long matchId,
      String round,
      int matchIndex,
      PlayerInfo player1,
      PlayerInfo player2,
      Double player1Score,
      Double player2Score,
      String status,
      Long winnerLearnerId,
      int questionCount
  ) {}

  public record PlayerInfo(
      Long learnerId,
      String displayName,
      String avatarKey,
      double points
  ) {}

  // ──────────────────────────────────────────────
  // Queue
  // ──────────────────────────────────────────────

  @Transactional
  public QueueStatus joinQueue(Long learnerId, Long certificationId) {
    if (learnerId == null) throw new IllegalArgumentException("A learner account is required");
    if (certificationId == null) throw new IllegalArgumentException("Choose a track first");

    Optional<WorldCupQueue> existing = queueRepo.findByLearnerIdAndCertificationId(learnerId, certificationId);
    if (existing.isPresent()) {
      return queueStatus(learnerId, certificationId);
    }

    // Check if already in an active bracket for this cert
    BracketView active = findActiveBracket(learnerId, certificationId);
    if (active != null) {
      return new QueueStatus(false, 0, lobbySize(), certificationId, active);
    }

    double points = 0;
    try {
      ChallengeRecord record = standingsService.record(learnerId);
      if (record != null) points = record.points();
    } catch (Exception ignored) {}

    WorldCupQueue entry = new WorldCupQueue();
    entry.setLearnerId(learnerId);
    entry.setCertificationId(certificationId);
    entry.setPoints(points);
    entry.setJoinedAt(LocalDateTime.now());
    queueRepo.save(entry);

    // Try to form a bracket
    int required = lobbySize();
    List<WorldCupQueue> waiting = queueRepo.findByCertificationIdOrderByPointsDesc(certificationId);
    if (waiting.size() >= required) {
      List<WorldCupQueue> selected = waiting.subList(0, required);
      WorldCupBracket bracket = createBracket(certificationId, selected);
      queueRepo.deleteAll(selected);
      queueRepo.flush();

      BracketView view = bracketView(bracket, matchRepo.findByBracketIdOrderByRoundAscMatchIndexAsc(bracket.getBracketId()));
      return new QueueStatus(false, 0, required, certificationId, view);
    }

    return queueStatus(learnerId, certificationId);
  }

  @Transactional
  public QueueStatus leaveQueue(Long learnerId, Long certificationId) {
    queueRepo.deleteByLearnerIdAndCertificationId(learnerId, certificationId);
    return new QueueStatus(false, (int) queueRepo.countByCertificationId(certificationId), lobbySize(), certificationId, null);
  }

  @Transactional(readOnly = true)
  public QueueStatus queueStatus(Long learnerId, Long certificationId) {
    boolean inQueue = queueRepo.findByLearnerIdAndCertificationId(learnerId, certificationId).isPresent();
    int size = (int) queueRepo.countByCertificationId(certificationId);
    BracketView active = findActiveBracket(learnerId, certificationId);
    return new QueueStatus(inQueue, size, lobbySize(), certificationId, active);
  }

  // ──────────────────────────────────────────────
  // Bracket
  // ──────────────────────────────────────────────

  @Transactional(readOnly = true)
  public BracketView getActiveBracketForLearner(Long learnerId) {
    List<Long> bracketIds = matchRepo.findBracketIdsByLearnerId(learnerId);
    for (Long bracketId : bracketIds) {
      WorldCupBracket bracket = bracketRepo.findById(bracketId).orElse(null);
      if (bracket != null && !ROUND_COMPLETED.equals(bracket.getCurrentRound())) {
        List<WorldCupMatch> matches = matchRepo.findByBracketIdOrderByRoundAscMatchIndexAsc(bracketId);
        return bracketView(bracket, matches);
      }
    }
    return null;
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> getHistory(Long learnerId) {
    List<Long> bracketIds = matchRepo.findBracketIdsByLearnerId(learnerId);
    List<Map<String, Object>> history = new ArrayList<>();
    for (Long bracketId : bracketIds) {
      WorldCupBracket bracket = bracketRepo.findById(bracketId).orElse(null);
      if (bracket == null) continue;
      List<WorldCupMatch> myMatches = matchRepo.findPlayerMatches(bracketId, learnerId);
      String bestRound = null;
      boolean won = Objects.equals(bracket.getWinnerLearnerId(), learnerId);
      for (WorldCupMatch m : myMatches) {
        if ("COMPLETED".equals(m.getStatus())) {
          if (Objects.equals(m.getWinnerLearnerId(), learnerId)) {
            bestRound = m.getRound();
          } else {
            bestRound = "ELIMINATED_" + m.getRound();
            break;
          }
        }
      }
      Double myBestScore = myMatches.stream()
          .filter(m -> "COMPLETED".equals(m.getStatus()))
          .mapToDouble(m -> Objects.equals(m.getPlayer1Id(), learnerId)
              ? (m.getPlayer1Score() != null ? m.getPlayer1Score() : 0)
              : (m.getPlayer2Score() != null ? m.getPlayer2Score() : 0))
          .max().orElse(0);
      Map<String, Object> entry = new LinkedHashMap<>();
      entry.put("bracketId", bracketId);
      entry.put("createdAt", bracket.getCreatedAt());
      entry.put("status", bracket.getCurrentRound());
      entry.put("won", won);
      entry.put("bestRound", bestRound);
      entry.put("bestScore", Math.round(myBestScore * 10.0) / 10.0);
      entry.put("rounds", myMatches.size());
      history.add(entry);
    }
    return history;
  }

  @Transactional(readOnly = true)
  public BracketView getBracket(Long bracketId) {
    WorldCupBracket bracket = bracketRepo.findById(bracketId)
        .orElseThrow(() -> new EntityNotFoundException("Bracket not found"));
    List<WorldCupMatch> matches = matchRepo.findByBracketIdOrderByRoundAscMatchIndexAsc(bracketId);
    return bracketView(bracket, matches);
  }

  @Transactional
  public MatchView reportScore(Long matchId, Long learnerId, Long attemptId, double score) {
    WorldCupMatch match = matchRepo.findById(matchId)
        .orElseThrow(() -> new EntityNotFoundException("Match not found"));

    if (Objects.equals(match.getPlayer1Id(), learnerId)) {
      match.setPlayer1AttemptId(attemptId);
      match.setPlayer1Score(score);
    } else if (Objects.equals(match.getPlayer2Id(), learnerId)) {
      match.setPlayer2AttemptId(attemptId);
      match.setPlayer2Score(score);
    } else {
      throw new IllegalArgumentException("You are not in this match");
    }

    if (match.getPlayer1Score() != null && match.getPlayer2Score() != null) {
      resolveMatch(match);
    }

    matchRepo.save(match);
    return matchView(match);
  }

  /** Called after a challenge attempt is submitted to auto-report the score. */
  @Transactional
  public void onAttemptSubmitted(Long attemptId, Long learnerId, double percentage) {
    AssessmentAttempt attempt = attemptRepo.findById(attemptId).orElse(null);
    if (attempt == null) return;

    Exam exam = attempt.getExam();
    if (exam == null || !"CHALLENGE".equalsIgnoreCase(exam.getExamType().getExamTypeText())) return;
    if (!ARENA_ID.equals(exam.getTargetScope())) return;

    // Find this learner's active bracket and current match
    Long certId = exam.getCertification() != null ? exam.getCertification().getCertificationId() : null;
    if (certId == null) return;

    List<WorldCupBracket> brackets = bracketRepo.findByCertificationIdOrderByCreatedAtDesc(certId);
    for (WorldCupBracket bracket : brackets) {
      if (ROUND_COMPLETED.equals(bracket.getCurrentRound())) continue;

      Optional<WorldCupMatch> matchOpt = matchRepo.findPlayerMatch(
          bracket.getBracketId(), learnerId, bracket.getCurrentRound());
      if (matchOpt.isPresent()) {
        reportScore(matchOpt.get().getMatchId(), learnerId, attemptId, percentage);
        return;
      }
    }
  }

  // ──────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────

  private WorldCupBracket createBracket(Long certificationId, List<WorldCupQueue> players) {
    // Seed: sort by points descending, pair 1v8, 2v7, 3v6, 4v5
    List<WorldCupQueue> sorted = new ArrayList<>(players);
    sorted.sort(Comparator.comparingDouble(WorldCupQueue::getPoints).reversed());

    List<Long> playerIds = sorted.stream().map(WorldCupQueue::getLearnerId).toList();

    WorldCupBracket bracket = new WorldCupBracket();
    bracket.setCertificationId(certificationId);
    bracket.setPlayersJson(ChallengeArenaService.writeJson(playerIds));
    bracket.setCurrentRound(ROUND_QF);
    bracket.setCreatedAt(LocalDateTime.now());

    // Link to current edition if any
    editionRepo.findAllByOrderByWeekStartDesc().stream()
        .filter(e -> e.isPublished() && Objects.equals(e.getCertificationId(), certificationId))
        .findFirst()
        .ifPresent(e -> bracket.setEditionId(e.getEditionId()));

    WorldCupBracket saved = bracketRepo.save(bracket);

    // Create QF matches: 1v8, 2v7, 3v6, 4v5
    int half = playerIds.size() / 2;
    for (int i = 0; i < half; i++) {
      WorldCupMatch match = new WorldCupMatch();
      match.setBracketId(saved.getBracketId());
      match.setRound(ROUND_QF);
      match.setMatchIndex(i);
      match.setPlayer1Id(playerIds.get(i));
      match.setPlayer2Id(playerIds.get(playerIds.size() - 1 - i));
      match.setStatus(STATUS_WAITING);
      matchRepo.save(match);
    }

    log.info("World Cup bracket created: bracketId={}, cert={}, players={}",
        saved.getBracketId(), certificationId, playerIds);
    return saved;
  }

  private void resolveMatch(WorldCupMatch match) {
    double s1 = match.getPlayer1Score();
    double s2 = match.getPlayer2Score();
    // Higher score wins; tie goes to player1 (higher seed)
    match.setWinnerLearnerId(s1 >= s2 ? match.getPlayer1Id() : match.getPlayer2Id());
    match.setStatus(STATUS_COMPLETED);
    match.setCompletedAt(LocalDateTime.now());

    // Check if all matches in this round are done
    WorldCupBracket bracket = bracketRepo.findById(match.getBracketId()).orElse(null);
    if (bracket == null) return;

    List<WorldCupMatch> roundMatches = matchRepo.findByBracketIdAndRound(bracket.getBracketId(), match.getRound());
    boolean allDone = roundMatches.stream().allMatch(m -> STATUS_COMPLETED.equals(m.getStatus()));

    if (allDone) {
      advanceBracket(bracket, roundMatches);
    }
  }

  private void advanceBracket(WorldCupBracket bracket, List<WorldCupMatch> completedMatches) {
    List<Long> winners = completedMatches.stream()
        .sorted(Comparator.comparingInt(WorldCupMatch::getMatchIndex))
        .map(WorldCupMatch::getWinnerLearnerId)
        .toList();

    String currentRound = bracket.getCurrentRound();
    int currentIdx = ROUND_ORDER.indexOf(currentRound);

    if (currentIdx >= ROUND_ORDER.size() - 1) {
      // Final is done
      bracket.setCurrentRound(ROUND_COMPLETED);
      bracket.setWinnerLearnerId(winners.get(0));
      bracket.setCompletedAt(LocalDateTime.now());
      bracketRepo.save(bracket);
      log.info("World Cup bracket {} completed. Winner: {}", bracket.getBracketId(), winners.get(0));
      return;
    }

    String nextRound = ROUND_ORDER.get(currentIdx + 1);
    bracket.setCurrentRound(nextRound);
    bracketRepo.save(bracket);

    // Create next round matches: pair winners in order
    for (int i = 0; i < winners.size() / 2; i++) {
      WorldCupMatch match = new WorldCupMatch();
      match.setBracketId(bracket.getBracketId());
      match.setRound(nextRound);
      match.setMatchIndex(i);
      match.setPlayer1Id(winners.get(i * 2));
      match.setPlayer2Id(winners.get(i * 2 + 1));
      match.setStatus(STATUS_WAITING);
      matchRepo.save(match);
    }

    log.info("World Cup bracket {} advanced to {}", bracket.getBracketId(), nextRound);
  }

  private BracketView findActiveBracket(Long learnerId, Long certificationId) {
    List<WorldCupBracket> brackets = bracketRepo.findByCertificationIdOrderByCreatedAtDesc(certificationId);
    for (WorldCupBracket bracket : brackets) {
      List<Long> playerIds = readPlayerIds(bracket.getPlayersJson());
      if (playerIds.contains(learnerId)) {
        List<WorldCupMatch> matches = matchRepo.findByBracketIdOrderByRoundAscMatchIndexAsc(bracket.getBracketId());
        return bracketView(bracket, matches);
      }
    }
    return null;
  }

  private BracketView bracketView(WorldCupBracket bracket, List<WorldCupMatch> matches) {
    List<Long> playerIds = readPlayerIds(bracket.getPlayersJson());
    Map<Long, Learner> learners = learnerRepo.findAllById(playerIds).stream()
        .collect(Collectors.toMap(Learner::getLearnerId, l -> l));

    // Get challenge points for each player
    Map<Long, Double> pointsMap = new HashMap<>();
    for (Long pid : playerIds) {
      try {
        ChallengeRecord rec = standingsService.record(pid);
        pointsMap.put(pid, rec != null ? rec.points() : 0.0);
      } catch (Exception e) {
        pointsMap.put(pid, 0.0);
      }
    }

    List<PlayerInfo> players = playerIds.stream().map(pid -> {
      Learner l = learners.get(pid);
      String name = l != null ? displayName(l) : "Player " + pid;
      String avatar = l != null ? l.getAvatarKey() : null;
      return new PlayerInfo(pid, name, avatar, pointsMap.getOrDefault(pid, 0.0));
    }).toList();

    List<MatchView> matchViews = matches.stream().map(this::matchView).toList();

    return new BracketView(
        bracket.getBracketId(),
        bracket.getCurrentRound(),
        players,
        matchViews,
        bracket.getWinnerLearnerId(),
        bracket.getCreatedAt()
    );
  }

  private MatchView matchView(WorldCupMatch match) {
    int questionCount = questionCountForRound(match.getRound(), match.getBracketId());
    return new MatchView(
        match.getMatchId(),
        match.getRound(),
        match.getMatchIndex(),
        playerInfo(match.getPlayer1Id()),
        playerInfo(match.getPlayer2Id()),
        match.getPlayer1Score(),
        match.getPlayer2Score(),
        match.getStatus(),
        match.getWinnerLearnerId(),
        questionCount
    );
  }

  private PlayerInfo playerInfo(Long learnerId) {
    if (learnerId == null) return null;
    Learner l = learnerRepo.findById(learnerId).orElse(null);
    double pts = 0;
    try {
      ChallengeRecord rec = standingsService.record(learnerId);
      if (rec != null) pts = rec.points();
    } catch (Exception ignored) {}
    return new PlayerInfo(
        learnerId,
        l != null ? displayName(l) : "Player " + learnerId,
        l != null ? l.getAvatarKey() : null,
        pts
    );
  }

  private int questionCountForRound(String round, Long bracketId) {
    // QF=10, SF=15, Final=based on exam questions in stage 3
    if (ROUND_QF.equals(round)) return 10;
    if (ROUND_SF.equals(round)) return 15;
    if (ROUND_FINAL.equals(round)) {
      WorldCupBracket bracket = bracketRepo.findById(bracketId).orElse(null);
      if (bracket != null) {
        Exam exam = findWorldCupExam();
        if (exam != null) {
          int nodeIndex = ROUND_NODE.get(ROUND_FINAL);
          List<ExamQuestion> finalQs = examQuestionRepo.findByExam_ExamIdOrderByDisplayOrderAsc(exam.getExamId()).stream()
              .filter(eq -> {
                ChallengeArenaConfig config = arenaConfigRepo.findById(ARENA_ID).orElse(null);
                if (config == null || config.getNodeLayoutJson() == null) return false;
                List<Integer> layout = readLayout(config.getNodeLayoutJson());
                int idx = eq.getDisplayOrder() - 1;
                return idx >= 0 && idx < layout.size() && layout.get(idx) == nodeIndex;
              })
              .toList();
          if (!finalQs.isEmpty()) return finalQs.size();
        }
      }
      return 20;
    }
    return 10;
  }

  private Exam findWorldCupExam() {
    return examRepo.findAll().stream()
        .filter(e -> ARENA_ID.equals(e.getTargetScope()))
        .findFirst()
        .orElse(null);
  }

  private String displayName(Learner learner) {
    if (learner.getUsername() != null && !learner.getUsername().isBlank()) {
      return learner.getUsername();
    }
    String first = learner.getFirstName() != null ? learner.getFirstName() : "";
    String last = learner.getLastName() != null ? learner.getLastName().substring(0, 1) + "." : "";
    return (first + " " + last).trim();
  }

  private int lobbySize() {
    ChallengeArenaConfig config = arenaConfigRepo.findById(ARENA_ID).orElse(null);
    if (config == null || config.getSettingsJson() == null) return 8;
    try {
      Map<String, Object> settings = JSON.readValue(config.getSettingsJson(), new TypeReference<>() {});
      Object val = settings.get("lobbySize");
      if (val instanceof Number n) return n.intValue();
    } catch (Exception ignored) {}
    return 8;
  }

  private static List<Long> readPlayerIds(String json) {
    try {
      return json == null ? List.of() : JSON.readValue(json, new TypeReference<List<Long>>() {});
    } catch (Exception e) {
      return List.of();
    }
  }

  private static List<Integer> readLayout(String json) {
    try {
      return json == null ? List.of() : JSON.readValue(json, new TypeReference<List<Integer>>() {});
    } catch (Exception e) {
      return List.of();
    }
  }

  // ── TEST METHODS (remove after testing) ──

  @Transactional
  public Map<String, Object> seedBotPlayers(Long certificationId, int count) {
    List<Long> botIds = new ArrayList<>();
    for (int i = 0; i < count; i++) {
      long fakeId = -100 - i;
      if (queueRepo.findByLearnerIdAndCertificationId(fakeId, certificationId).isEmpty()) {
        WorldCupQueue entry = new WorldCupQueue();
        entry.setLearnerId(fakeId);
        entry.setCertificationId(certificationId);
        entry.setPoints(Math.random() * 500);
        entry.setJoinedAt(LocalDateTime.now());
        queueRepo.save(entry);
        botIds.add(fakeId);
      }
    }
    int total = (int) queueRepo.countByCertificationId(certificationId);
    return Map.of("seeded", botIds.size(), "totalInQueue", total, "botIds", botIds);
  }

  @Transactional
  public Map<String, Object> simulateBotScores(Long bracketId, Long realLearnerId) {
    WorldCupBracket bracket = bracketRepo.findById(bracketId)
        .orElseThrow(() -> new EntityNotFoundException("Bracket not found"));

    String round = bracket.getCurrentRound();
    if (ROUND_COMPLETED.equals(round)) return Map.of("status", "already_completed");

    List<WorldCupMatch> matches = matchRepo.findByBracketIdAndRound(bracketId, round);
    int resolved = 0;
    for (WorldCupMatch match : matches) {
      boolean hasReal = Objects.equals(match.getPlayer1Id(), realLearnerId)
          || Objects.equals(match.getPlayer2Id(), realLearnerId);

      if (hasReal) {
        // Score only the bot side
        if (Objects.equals(match.getPlayer1Id(), realLearnerId) && match.getPlayer2Score() == null) {
          match.setPlayer2Score(Math.random() * 60);
          if (match.getPlayer1Score() != null) { resolveMatch(match); resolved++; }
          matchRepo.save(match);
        } else if (Objects.equals(match.getPlayer2Id(), realLearnerId) && match.getPlayer1Score() == null) {
          match.setPlayer1Score(Math.random() * 60);
          if (match.getPlayer2Score() != null) { resolveMatch(match); resolved++; }
          matchRepo.save(match);
        }
      } else {
        // Both bots: give random scores and resolve
        if (match.getPlayer1Score() == null) match.setPlayer1Score(Math.random() * 100);
        if (match.getPlayer2Score() == null) match.setPlayer2Score(Math.random() * 100);
        resolveMatch(match);
        matchRepo.save(match);
        resolved++;
      }
    }
    return Map.of("round", round, "matchesResolved", resolved);
  }

  @Transactional
  public void cleanupTestData() {
    // Delete bot queue entries and brackets containing bots
    queueRepo.findAll().stream()
        .filter(q -> q.getLearnerId() < 0)
        .forEach(queueRepo::delete);

    bracketRepo.findAll().stream()
        .filter(b -> {
          List<Long> ids = readPlayerIds(b.getPlayersJson());
          return ids.stream().anyMatch(id -> id < 0);
        })
        .forEach(b -> {
          matchRepo.findByBracketIdOrderByRoundAscMatchIndexAsc(b.getBracketId())
              .forEach(matchRepo::delete);
          bracketRepo.delete(b);
        });
  }
}
