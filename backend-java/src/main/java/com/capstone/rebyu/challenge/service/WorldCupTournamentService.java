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

  private static final Map<String, Integer> ROUND_NODE = Map.of(
      ROUND_QF, 1,
      ROUND_SF, 2,
      ROUND_FINAL, 3
  );

  private static final List<String> ROUND_ORDER = List.of(ROUND_QF, ROUND_SF, ROUND_FINAL);

  /** How long a learner waits in the queue before bots fill the empty seats. */
  public static final int BOT_WAIT_SECONDS = 120;

  /*
   * Bots are seats with negative ids -1..-99 (the old test bots use -100 and below).
   * They have no learner account, answer their match as soon as it is drawn, and a
   * bot-against-bot match settles on its own, so a bracket with bots keeps moving.
   */
  private static final List<String> BOT_NAMES = List.of(
      "Bot Ada", "Bot Turing", "Bot Grace", "Bot Linus", "Bot Hedy", "Bot Dijkstra", "Bot Ritchie",
      "Bot Lovelace", "Bot Knuth", "Bot Hopper", "Bot Babbage", "Bot Shannon", "Bot Liskov", "Bot Kay", "Bot Wirth");

  public static boolean isBot(Long id) {
    return id != null && id < 0 && id > -100;
  }

  private static String botName(Long id) {
    return BOT_NAMES.get((int) ((-id - 1) % BOT_NAMES.size()));
  }

  /** A bot's score for one match: steady mid-range so humans can beat them. */
  private static double botScore() {
    return Math.round((40 + Math.random() * 45) * 10.0) / 10.0;
  }

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


  @Transactional
  public QueueStatus joinQueue(Long learnerId, Long certificationId) {
    if (learnerId == null) throw new IllegalArgumentException("A learner account is required");
    if (certificationId == null) throw new IllegalArgumentException("Choose a track first");
    // Only the active weekly exam's certification is open; its questions are the bracket.
    Long openTrack = editionRepo.findActive(java.time.LocalDate.now())
        .map(com.capstone.rebyu.challenge.entity.WorldCupEdition::getCertificationId)
        .orElse(null);
    if (!certificationId.equals(openTrack)) {
      throw new IllegalArgumentException("This week's Champions Cup is not played on that certification");
    }

    Optional<WorldCupQueue> existing = queueRepo.findByLearnerIdAndCertificationId(learnerId, certificationId);
    if (existing.isPresent()) {
      return queueStatus(learnerId, certificationId);
    }

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

  /**
   * After {@link #BOT_WAIT_SECONDS} in the queue with nobody else to fill the bracket,
   * draws it now: every learner waiting on this track plus bots for the empty seats.
   */
  @Transactional
  public QueueStatus fillWithBots(Long learnerId, Long certificationId) {
    if (learnerId == null) throw new IllegalArgumentException("A learner account is required");
    if (certificationId == null) throw new IllegalArgumentException("Choose a track first");

    Optional<WorldCupQueue> mine = queueRepo.findByLearnerIdAndCertificationId(learnerId, certificationId);
    if (mine.isEmpty()) {
      // Someone else's timer already drew the bracket, or the learner left.
      return queueStatus(learnerId, certificationId);
    }
    LocalDateTime joined = mine.get().getJoinedAt();
    if (joined != null && joined.plusSeconds(BOT_WAIT_SECONDS - 5).isAfter(LocalDateTime.now())) {
      throw new IllegalArgumentException("Bots join after " + (BOT_WAIT_SECONDS / 60) + " minutes in the queue.");
    }

    int required = lobbySize();
    List<WorldCupQueue> waiting = queueRepo.findByCertificationIdOrderByPointsDesc(certificationId).stream()
        .filter(q -> q.getLearnerId() != null && q.getLearnerId() > 0)
        .limit(required)
        .toList();

    List<WorldCupQueue> seats = new ArrayList<>(waiting);
    // Bots seed below every human, so a learner meets them from the top of the bracket.
    int offset = (int) (Math.random() * BOT_NAMES.size());
    for (int i = 0; seats.size() < required; i++) {
      WorldCupQueue bot = new WorldCupQueue();
      bot.setLearnerId(-1L - ((offset + i) % BOT_NAMES.size()));
      bot.setCertificationId(certificationId);
      bot.setPoints(-1 - i);
      seats.add(bot);
    }

    WorldCupBracket bracket = createBracket(certificationId, seats);
    queueRepo.deleteAll(waiting);
    queueRepo.flush();
    log.info("World Cup bracket {} drawn with {} bot(s) after the queue wait", bracket.getBracketId(),
        required - waiting.size());

    BracketView view = bracketView(bracket, matchRepo.findByBracketIdOrderByRoundAscMatchIndexAsc(bracket.getBracketId()));
    return new QueueStatus(false, 0, required, certificationId, view);
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


  @Transactional(readOnly = true)
  public BracketView getActiveBracketForLearner(Long learnerId) {
    List<Long> bracketIds = matchRepo.findBracketIdsByLearnerId(learnerId);
    for (Long bracketId : bracketIds) {
      WorldCupBracket bracket = bracketRepo.findById(bracketId).orElse(null);
      if (bracket != null && isLive(bracket)) {
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
      entry.put("certificationId", bracket.getCertificationId());
      entry.put("status", bracket.getCurrentRound());
      entry.put("won", won);
      entry.put("bestRound", bestRound);
      entry.put("bestScore", Math.round(myBestScore * 10.0) / 10.0);
      entry.put("rounds", myMatches.size());
      history.add(entry);
    }
    return history;
  }

  /** The bracket a match belongs to, finished or not (for a round's result screen). */
  @Transactional(readOnly = true)
  public BracketView bracketForMatch(Long matchId) {
    WorldCupMatch match = matchRepo.findById(matchId)
        .orElseThrow(() -> new EntityNotFoundException("Match not found"));
    return getBracket(match.getBracketId());
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

  @Transactional
  public void onAttemptSubmitted(Long attemptId, Long learnerId, double percentage) {
    AssessmentAttempt attempt = attemptRepo.findById(attemptId).orElse(null);
    if (attempt == null) return;

    Exam exam = attempt.getExam();
    if (exam == null || !"CHALLENGE".equalsIgnoreCase(exam.getExamType().getExamTypeText())) return;
    if (!ARENA_ID.equals(exam.getTargetScope())) return;

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


  private WorldCupBracket createBracket(Long certificationId, List<WorldCupQueue> players) {
    List<WorldCupQueue> sorted = new ArrayList<>(players);
    sorted.sort(Comparator.comparingDouble(WorldCupQueue::getPoints).reversed());

    List<Long> playerIds = sorted.stream().map(WorldCupQueue::getLearnerId).toList();

    WorldCupBracket bracket = new WorldCupBracket();
    bracket.setCertificationId(certificationId);
    bracket.setPlayersJson(ChallengeArenaService.writeJson(playerIds));
    bracket.setCurrentRound(ROUND_QF);
    bracket.setCreatedAt(LocalDateTime.now());

    // Drawn from this week's exam (the only open track), never a past or future week.
    editionRepo.findActive(java.time.LocalDate.now())
        .filter(e -> Objects.equals(e.getCertificationId(), certificationId))
        .ifPresent(e -> bracket.setEditionId(e.getEditionId()));

    WorldCupBracket saved = bracketRepo.save(bracket);

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
    playBots(saved.getBracketId(), ROUND_QF);
    return bracketRepo.findById(saved.getBracketId()).orElse(saved);
  }

  private void resolveMatch(WorldCupMatch match) {
    double s1 = match.getPlayer1Score();
    double s2 = match.getPlayer2Score();
    match.setWinnerLearnerId(s1 >= s2 ? match.getPlayer1Id() : match.getPlayer2Id());
    match.setStatus(STATUS_COMPLETED);
    match.setCompletedAt(LocalDateTime.now());

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
    playBots(bracket.getBracketId(), nextRound);
  }

  /** Bots hand in their score as soon as a round is drawn; bot-vs-bot matches settle now. */
  private void playBots(Long bracketId, String round) {
    for (WorldCupMatch match : matchRepo.findByBracketIdAndRound(bracketId, round)) {
      if (STATUS_COMPLETED.equals(match.getStatus())) continue;
      boolean changed = false;
      if (isBot(match.getPlayer1Id()) && match.getPlayer1Score() == null) {
        match.setPlayer1Score(botScore());
        changed = true;
      }
      if (isBot(match.getPlayer2Id()) && match.getPlayer2Score() == null) {
        match.setPlayer2Score(botScore());
        changed = true;
      }
      if (!changed) continue;
      matchRepo.save(match);
      if (match.getPlayer1Score() != null && match.getPlayer2Score() != null) {
        resolveMatch(match);
        matchRepo.save(match);
      }
    }
  }

  /**
   * A bracket a learner is still playing: not finished, and drawn for this week's exam.
   * Finished brackets and ones from an expired week are history, so they never send a
   * learner back to an old bracket instead of a new queue.
   */
  private boolean isLive(WorldCupBracket bracket) {
    if (ROUND_COMPLETED.equals(bracket.getCurrentRound())) return false;
    Long activeEditionId = editionRepo.findActive(java.time.LocalDate.now())
        .map(com.capstone.rebyu.challenge.entity.WorldCupEdition::getEditionId)
        .orElse(null);
    return activeEditionId != null && activeEditionId.equals(bracket.getEditionId());
  }

  private BracketView findActiveBracket(Long learnerId, Long certificationId) {
    List<WorldCupBracket> brackets = bracketRepo.findByCertificationIdOrderByCreatedAtDesc(certificationId);
    for (WorldCupBracket bracket : brackets) {
      if (!isLive(bracket)) continue;
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

    Map<Long, Double> pointsMap = new HashMap<>();
    for (Long pid : playerIds) {
      if (isBot(pid)) {
        pointsMap.put(pid, 0.0);
        continue;
      }
      try {
        ChallengeRecord rec = standingsService.record(pid);
        pointsMap.put(pid, rec != null ? rec.points() : 0.0);
      } catch (Exception e) {
        pointsMap.put(pid, 0.0);
      }
    }

    List<PlayerInfo> players = playerIds.stream().map(pid -> {
      Learner l = learners.get(pid);
      String name = isBot(pid) ? botName(pid) : l != null ? displayName(l) : "Player " + pid;
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
    if (isBot(learnerId)) return new PlayerInfo(learnerId, botName(learnerId), null, 0);
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

  /** How many questions a round's match answers: the size of that stage's set. */
  private int questionCountForRound(String round, Long bracketId) {
    Integer node = ROUND_NODE.get(round);
    if (node == null) return 0;
    ChallengeArenaConfig config = arenaConfigRepo.findById(ARENA_ID).orElse(null);
    if (config == null || config.getNodeLayoutJson() == null) return 0;
    int count = 0;
    for (Integer stage : readLayout(config.getNodeLayoutJson())) {
      if (stage != null && stage.intValue() == node) count++;
    }
    return count;
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
    queueRepo.findAll().stream()
        .filter(q -> q.getLearnerId() <= -100)
        .forEach(queueRepo::delete);

    bracketRepo.findAll().stream()
        .filter(b -> {
          List<Long> ids = readPlayerIds(b.getPlayersJson());
          return ids.stream().anyMatch(id -> id <= -100);
        })
        .forEach(b -> {
          matchRepo.findByBracketIdOrderByRoundAscMatchIndexAsc(b.getBracketId())
              .forEach(matchRepo::delete);
          bracketRepo.delete(b);
        });
  }
}
