package com.capstone.rebyu.challenge.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.dto.QuestionDto;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.mapper.QuestionMapper;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.challenge.entity.ChallengeArenaConfig;
import com.capstone.rebyu.challenge.repository.ChallengeArenaConfigRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * The IT Olympics arenas, and the problems an admin configures into them.
 *
 * <h3>An arena's problem set is an exam</h3>
 * One {@code CHALLENGE} exam per arena. That is not a workaround -- it is what
 * makes a challenge runnable at all. The attempt engine already starts, saves,
 * submits and grades an exam, and it already grades the two question types the
 * solo arenas are made of: PROGRAMMING through Judge0 and DIAGRAM through the
 * structural grader. Modelling arena problems separately would have meant
 * writing both a second time, and they would have drifted.
 *
 * <p>The arena is named by {@code targetScope} -- "codestrike", "blueprint",
 * "worldcup" -- the same way generated practice exams mark themselves with
 * "GENERATED". {@code examType} says it is a challenge; {@code targetScope}
 * says which one.
 *
 * <h3>Configured, and what it gates</h3>
 * An arena is configured when its exam exists and holds at least one question.
 * Until then the learner's view keeps it locked: an arena with no problems is
 * not a hard challenge, it is a run that opens onto nothing, and letting a
 * learner in to discover that is worse than saying so on the card.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChallengeArenaService {

  public static final String CHALLENGE_EXAM_TYPE = "CHALLENGE";

  /** The arenas that exist. Not data: each is a built surface with its own run. */
  public static final List<String> ARENA_IDS = List.of("codestrike", "blueprint", "worldcup");

  private final ExamRepository exams;
  private final ExamTypeRepository examTypes;
  private final ExamQuestionRepository examQuestions;
  private final QuestionRepository questions;
  private final CertificationRepository certifications;
  private final ChallengeArenaConfigRepository arenaConfigs;
  private final QuestionMapper questionMapper;

  private static final ObjectMapper JSON = new ObjectMapper();

  /**
   * One run setting an arena accepts, and its bounds.
   *
   * <p>Kept here rather than trusted from the client: the admin page renders
   * whatever fields it knows about, but a run reads these values, so an unknown
   * key or a negative time limit has to be refused where it is stored.
   */
  private record SettingSpec(String key, int defaultValue, int min, int max) {}

  private static final Map<String, List<SettingSpec>> SETTING_SPECS = Map.of(
      "codestrike", List.of(
          new SettingSpec("problems", 10, 1, 50),
          new SettingSpec("timeLimit", 45, 0, 600),
          new SettingSpec("weightCorrect", 60, 0, 100),
          new SettingSpec("weightSpeed", 20, 0, 100),
          new SettingSpec("weightBigO", 20, 0, 100)),
      "blueprint", List.of(
          new SettingSpec("problems", 10, 1, 50),
          new SettingSpec("timeLimit", 60, 0, 600),
          new SettingSpec("passRules", 80, 1, 100),
          new SettingSpec("components", 8, 1, 50)),
      "worldcup", List.of(
          new SettingSpec("lobbySize", 8, 2, 64),
          new SettingSpec("roundSeconds", 180, 10, 3600),
          new SettingSpec("countdown", 3, 0, 60),
          new SettingSpec("queueTimeout", 120, 10, 3600)));

  /**
   * What the learner's card and the admin list both read.
   *
   * <p>{@code configured} means "a learner can enter": it has problems AND an
   * admin has not paused it. Folding the pause in here, rather than adding a
   * second flag every learner screen would have to learn, is what makes the
   * switch take effect on all of them at once. {@code live} is the switch
   * itself, for the admin screens.
   */
  public record ArenaStatus(
      String arenaId,
      boolean configured,
      boolean live,
      int problemCount,
      Long examId,
      Long certificationId,
      Map<String, Integer> settings,
      List<Long> disabledTrackIds) {}

  /** One problem as the admin hands it over: a question already saved to the bank. */
  public record ArenaProblemRequest(Long questionId, Integer nodeIndex, BigDecimal points) {}

  public record SaveArenaProblemsRequest(
      Long certificationId, Integer timeLimitMinutes, List<ArenaProblemRequest> problems) {}

  /**
   * One saved problem, as the admin builder reloads it: the bank question with
   * its parts, and where in the run it sits.
   */
  public record ArenaProblemView(
      Long questionId,
      Integer nodeIndex,
      Integer displayOrder,
      BigDecimal points,
      QuestionDto question,
      List<QuestionDto> subQuestions) {}

  @Transactional(readOnly = true)
  public List<ArenaStatus> statuses() {
    return ARENA_IDS.stream().map(this::status).toList();
  }

  @Transactional(readOnly = true)
  public ArenaStatus status(String arenaId) {
    Optional<ChallengeArenaConfig> config = arenaConfigs.findById(arenaId);
    Map<String, Integer> settings = settingsOf(arenaId, config);
    boolean live = config.map(ChallengeArenaConfig::getLive).orElse(null) != Boolean.FALSE;
    List<Long> disabledTracks = config
        .map(ChallengeArenaConfig::getDisabledTracksJson)
        .map(ChallengeArenaService::readIds)
        .orElse(List.of());

    Exam exam = findArenaExam(arenaId);
    if (exam == null) {
      return new ArenaStatus(arenaId, false, live, 0, null, null, settings, disabledTracks);
    }

    int count = examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(exam.getExamId()).size();
    return new ArenaStatus(
        arenaId,
        live && count > 0,
        live,
        count,
        exam.getExamId(),
        exam.getCertification() == null ? null : exam.getCertification().getCertificationId(),
        settings,
        disabledTracks);
  }

  /** Opens or pauses an arena for learners. Its problems are kept either way. */
  @Transactional
  public ArenaStatus setLive(String arenaId, boolean live) {
    requireKnownArena(arenaId);
    ChallengeArenaConfig config = configFor(arenaId);
    config.setLive(live);
    config.setUpdatedAt(LocalDateTime.now());
    arenaConfigs.save(config);
    log.info("Arena {} {}", arenaId, live ? "opened" : "paused");
    return status(arenaId);
  }

  /**
   * Replaces the World Cup tracks switched off.
   *
   * <p>Only certifications that exist are accepted, so a typo cannot quietly
   * hide nothing while the admin believes a track is closed.
   */
  @Transactional
  public ArenaStatus setDisabledTracks(List<Long> certificationIds) {
    List<Long> ids = certificationIds == null
        ? List.of()
        : certificationIds.stream().filter(java.util.Objects::nonNull).distinct().sorted().toList();
    for (Long id : ids) {
      if (!certifications.existsById(id)) {
        throw new EntityNotFoundException("Certification not found: " + id);
      }
    }
    ChallengeArenaConfig config = configFor("worldcup");
    config.setDisabledTracksJson(writeJson(ids));
    config.setUpdatedAt(LocalDateTime.now());
    arenaConfigs.save(config);
    log.info("World Cup tracks disabled: {}", ids);
    return status("worldcup");
  }

  /**
   * The arena's run settings: what the admin saved, over the defaults.
   *
   * <p>Defaults fill any key never saved, so an arena reads a complete set from
   * its first day, and a knob added later appears with its default instead of
   * missing.
   */
  @Transactional(readOnly = true)
  public Map<String, Integer> settingsOf(String arenaId) {
    return settingsOf(arenaId, arenaConfigs.findById(arenaId));
  }

  /** Resolves settings from an already-loaded config, for callers outside this service. */
  public static Map<String, Integer> settingsOf(String arenaId, Optional<ChallengeArenaConfig> config) {
    Map<String, Integer> result = new LinkedHashMap<>();
    for (SettingSpec spec : SETTING_SPECS.getOrDefault(arenaId, List.of())) {
      result.put(spec.key(), spec.defaultValue());
    }
    config
        .map(ChallengeArenaConfig::getSettingsJson)
        .map(ChallengeArenaService::readSettings)
        .ifPresent(saved -> saved.forEach((key, value) -> {
          if (result.containsKey(key) && value != null) {
            result.put(key, value);
          }
        }));
    return result;
  }

  /**
   * Replaces an arena's run settings.
   *
   * <p>Every key is checked against the arena's own list and bounds, and
   * CodeStrike's three weights must total 100 -- a run scored on weights that
   * sum to 90 would cap every learner at 90%.
   *
   * <p>The time limit is also written through to the arena's exam, because the
   * attempt engine times a run from {@code exams.duration_minutes}, not from
   * here. Saving it only here would change the number on the admin screen and
   * nothing a learner experiences.
   */
  @Transactional
  public ArenaStatus saveSettings(String arenaId, Map<String, Integer> requested) {
    requireKnownArena(arenaId);
    if (requested == null || requested.isEmpty()) {
      throw new IllegalArgumentException("No settings to save");
    }

    Map<String, SettingSpec> specs = SETTING_SPECS.get(arenaId).stream()
        .collect(Collectors.toMap(SettingSpec::key, spec -> spec));

    Map<String, Integer> merged = new LinkedHashMap<>(settingsOf(arenaId));
    for (Map.Entry<String, Integer> entry : requested.entrySet()) {
      SettingSpec spec = specs.get(entry.getKey());
      if (spec == null) {
        throw new IllegalArgumentException("Unknown setting for " + titleFor(arenaId) + ": " + entry.getKey());
      }
      Integer value = entry.getValue();
      if (value == null || value < spec.min() || value > spec.max()) {
        throw new IllegalArgumentException(
            entry.getKey() + " must be between " + spec.min() + " and " + spec.max());
      }
      merged.put(entry.getKey(), value);
    }

    if ("codestrike".equals(arenaId)) {
      int total = merged.get("weightCorrect") + merged.get("weightSpeed") + merged.get("weightBigO");
      if (total != 100) {
        throw new IllegalArgumentException("Scoring weights must total 100% (currently " + total + "%)");
      }
    }
    if ("worldcup".equals(arenaId)) {
      int lobby = merged.get("lobbySize");
      if (Integer.bitCount(lobby) != 1) {
        throw new IllegalArgumentException("Lobby size must be a power of two for a bracket (2, 4, 8, 16, ...)");
      }
    }

    ChallengeArenaConfig config = configFor(arenaId);
    config.setSettingsJson(writeJson(merged));
    config.setUpdatedAt(LocalDateTime.now());
    arenaConfigs.save(config);

    Integer timeLimit = merged.get("timeLimit");
    Exam exam = findArenaExam(arenaId);
    if (timeLimit != null && exam != null) {
      exam.setDurationMinutes(timeLimit <= 0 ? null : timeLimit);
      exam.setUpdatedAt(LocalDateTime.now());
      exams.save(exam);
    }

    log.info("Arena {} settings saved: {}", arenaId, merged);
    return status(arenaId);
  }

  /**
   * The arena's saved problem set, for the admin builder to reload.
   *
   * <p>Sub-questions are fetched for the whole set in one query rather than one
   * per problem -- the database is a round trip away, and a ten-node roadmap is
   * a hundred problems.
   */
  @Transactional(readOnly = true)
  public List<ArenaProblemView> problems(String arenaId) {
    requireKnownArena(arenaId);
    Exam exam = findArenaExam(arenaId);
    if (exam == null) {
      return List.of();
    }

    List<ExamQuestion> rows = examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(exam.getExamId());
    List<Integer> layout = arenaConfigs.findById(arenaId)
        .map(ChallengeArenaConfig::getNodeLayoutJson)
        .map(ChallengeArenaService::readLayout)
        .orElse(List.of());

    return viewsOf(rows.stream().map(ExamQuestion::getQuestion).toList(),
        index -> index < layout.size() ? layout.get(index) : 1,
        index -> rows.get(index).getPoints());
  }

  /** Bank questions as the builders reload them, with their parts. */
  @Transactional(readOnly = true)
  public List<ArenaProblemView> viewsOf(
      List<Question> parents,
      java.util.function.IntFunction<Integer> nodeIndexAt,
      java.util.function.IntFunction<BigDecimal> pointsAt) {
    if (parents.isEmpty()) {
      return List.of();
    }
    Map<Long, List<QuestionDto>> partsByParent = questions
        .findSubQuestionsByParentIdIn(parents.stream().map(Question::getQuestionId).toList())
        .stream()
        .collect(Collectors.groupingBy(
            part -> part.getParentQuestion().getQuestionId(),
            LinkedHashMap::new,
            Collectors.mapping(questionMapper::toDto, Collectors.toList())));

    List<ArenaProblemView> views = new ArrayList<>();
    for (int index = 0; index < parents.size(); index++) {
      Question question = parents.get(index);
      views.add(new ArenaProblemView(
          question.getQuestionId(),
          nodeIndexAt.apply(index),
          index + 1,
          pointsAt.apply(index),
          questionMapper.toDto(question),
          partsByParent.getOrDefault(question.getQuestionId(), List.of())));
    }
    return views;
  }

  /**
   * Replaces an arena's problem set.
   *
   * <p>Replace rather than append: the builder edits the whole set on one
   * screen and saves it whole, so a merge would leave behind problems the admin
   * had just deleted and believed were gone.
   */
  @Transactional
  public ArenaStatus saveProblems(String arenaId, SaveArenaProblemsRequest request) {
    requireKnownArena(arenaId);

    if (request == null || request.problems() == null || request.problems().isEmpty()) {
      throw new IllegalArgumentException("An arena needs at least one problem");
    }
    if (request.certificationId() == null) {
      throw new IllegalArgumentException("Choose the certification these problems come from");
    }

    Certification certification = certifications.findById(request.certificationId())
        .orElseThrow(() -> new EntityNotFoundException(
            "Certification not found: " + request.certificationId()));

    Exam exam = findArenaExam(arenaId);
    LocalDateTime now = LocalDateTime.now();

    if (exam == null) {
      ExamType examType = examTypes.findByExamTypeText(CHALLENGE_EXAM_TYPE)
          .orElseThrow(() -> new IllegalStateException(
              "Exam type CHALLENGE is not seeded -- see ExamTypeSeeder"));

      exam = new Exam();
      exam.setExamType(examType);
      exam.setTargetScope(arenaId);
      exam.setTitle(titleFor(arenaId));
      // Answers are released after submitting: an arena run is practice against
      // a judge, and a learner who cannot see what they got wrong learns
      // nothing from having run it.
      exam.setReleaseAnswersAfterSubmit(true);
      exam.setPassingScore(new BigDecimal("70.00"));
      exam.setStatus(Exam.Status.PUBLISHED);
      exam.setPublishedAt(now);
    }

    // No limit in the request means "keep the arena's own": the saved setting,
    // which is what the Settings tab shows.
    Integer timeLimit = request.timeLimitMinutes() != null
        ? request.timeLimitMinutes()
        : settingsOf(arenaId).get("timeLimit");

    exam.setCertification(certification);
    exam.setDurationMinutes(timeLimit == null || timeLimit <= 0 ? null : timeLimit);
    exam.setTotalQuestions(request.problems().size());
    exam.setUpdatedAt(now);
    exam = exams.save(exam);

    for (ArenaProblemRequest problem : request.problems()) {
      if (problem.questionId() == null) {
        throw new IllegalArgumentException("Every arena problem needs a question");
      }
    }
    // One query for the whole set, not one per problem.
    Map<Long, Question> byId = questions
        .findAllById(request.problems().stream().map(ArenaProblemRequest::questionId).toList())
        .stream()
        .collect(Collectors.toMap(Question::getQuestionId, question -> question));

    // Out with the previous set before the new one goes in, so display order
    // cannot collide with rows that are about to be removed.
    examQuestions.deleteAll(examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(exam.getExamId()));

    int order = 1;
    List<Integer> layout = new ArrayList<>();
    for (ArenaProblemRequest problem : request.problems()) {
      Question question = byId.get(problem.questionId());
      if (question == null) {
        throw new EntityNotFoundException("Question not found: " + problem.questionId());
      }

      examQuestions.save(ExamQuestion.builder()
          .exam(exam)
          .question(question)
          .displayOrder(order++)
          .points(problem.points())
          .build());
      layout.add(problem.nodeIndex() == null || problem.nodeIndex() < 1 ? 1 : problem.nodeIndex());
    }

    // Which node each problem sits in: the exam rows keep only the order.
    ChallengeArenaConfig config = configFor(arenaId);
    config.setNodeLayoutJson(writeJson(layout));
    config.setUpdatedAt(now);
    arenaConfigs.save(config);

    log.info("Arena {} configured with {} problem(s) on certification {}",
        arenaId, request.problems().size(), certification.getCertificationId());

    return status(arenaId);
  }

  /** Removes an arena's problem set, which locks it again for learners. */
  @Transactional
  public ArenaStatus clearProblems(String arenaId) {
    requireKnownArena(arenaId);
    Exam exam = findArenaExam(arenaId);
    if (exam != null) {
      examQuestions.deleteAll(
          examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(exam.getExamId()));
      exam.setTotalQuestions(0);
      exams.save(exam);
    }
    return status(arenaId);
  }

  private Exam findArenaExam(String arenaId) {
    return exams.findAll().stream()
        .filter(exam -> exam.getExamType() != null
            && CHALLENGE_EXAM_TYPE.equals(exam.getExamType().getExamTypeText()))
        .filter(exam -> arenaId.equals(exam.getTargetScope()))
        .findFirst()
        .orElse(null);
  }

  private ChallengeArenaConfig configFor(String arenaId) {
    return arenaConfigs.findById(arenaId).orElseGet(() -> {
      ChallengeArenaConfig created = new ChallengeArenaConfig();
      created.setArenaId(arenaId);
      return created;
    });
  }

  private static Map<String, Integer> readSettings(String json) {
    try {
      return json == null ? Map.of() : JSON.readValue(json, new TypeReference<Map<String, Integer>>() {});
    } catch (Exception e) {
      // A corrupt document falls back to the defaults rather than locking the arena.
      log.warn("Unreadable arena settings, using defaults: {}", e.getMessage());
      return Map.of();
    }
  }

  private static List<Integer> readLayout(String json) {
    try {
      return json == null ? List.of() : JSON.readValue(json, new TypeReference<List<Integer>>() {});
    } catch (Exception e) {
      log.warn("Unreadable arena node layout, treating as one node: {}", e.getMessage());
      return Collections.emptyList();
    }
  }

  private static List<Long> readIds(String json) {
    try {
      return json == null ? List.of() : JSON.readValue(json, new TypeReference<List<Long>>() {});
    } catch (Exception e) {
      log.warn("Unreadable disabled tracks, treating all as enabled: {}", e.getMessage());
      return List.of();
    }
  }

  static String writeJson(Object value) {
    try {
      return JSON.writeValueAsString(value);
    } catch (Exception e) {
      throw new IllegalStateException("Could not serialise arena config", e);
    }
  }

  static void requireKnownArena(String arenaId) {
    if (!ARENA_IDS.contains(arenaId)) {
      throw new IllegalArgumentException("Unknown arena: " + arenaId);
    }
  }

  private static String titleFor(String arenaId) {
    return Map.of(
        "codestrike", "CodeStrike",
        "blueprint", "Blueprint Arena",
        "worldcup", "World Cup").getOrDefault(arenaId, arenaId);
  }
}
