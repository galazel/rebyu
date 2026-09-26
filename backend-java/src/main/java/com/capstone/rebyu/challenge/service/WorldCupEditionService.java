package com.capstone.rebyu.challenge.service;

import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.challenge.entity.WorldCupEdition;
import com.capstone.rebyu.challenge.repository.WorldCupEditionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The World Cup's weekly editions: drafted a week at a time, one question set
 * per bracket stage, and published into the arena's exam.
 *
 * <p>A draft is stored, not held in the admin's browser: a week's three
 * question sets are an evening's authoring, and losing them to a closed tab was
 * the whole reason this exists. Publishing is the only step learners see -- it
 * replaces the World Cup exam's questions with this week's, stage by stage.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorldCupEditionService {

  /** The bracket's stages, in the order they are played. */
  public static final List<String> STAGE_IDS = List.of("quarterfinal", "semifinal", "final");

  private static final String ARENA_ID = "worldcup";
  private static final ObjectMapper JSON = new ObjectMapper();

  private final WorldCupEditionRepository editions;
  private final CertificationRepository certifications;
  private final QuestionRepository questions;
  private final ChallengeArenaService arenas;

  /** The list row: enough to show the week without loading its questions. */
  public record EditionSummary(
      Long editionId,
      LocalDate weekStart,
      Long certificationId,
      Long lessonId,
      boolean published,
      LocalDateTime publishedAt,
      Map<String, Integer> stageCounts) {}

  /** One edition opened for editing: every stage's questions, reloadable. */
  public record EditionDetail(
      EditionSummary edition,
      Map<String, List<ChallengeArenaService.ArenaProblemView>> stages) {}

  public record CreateEditionRequest(LocalDate weekStart, Long certificationId, Long lessonId) {}

  /** Stage id -> the bank questions it runs, in order. */
  public record SaveStagesRequest(Map<String, List<Long>> stages) {}

  @Transactional(readOnly = true)
  public List<EditionSummary> list() {
    return editions.findAllByOrderByWeekStartDesc().stream().map(this::summaryOf).toList();
  }

  @Transactional(readOnly = true)
  public EditionDetail detail(Long editionId) {
    WorldCupEdition edition = find(editionId);
    Map<String, List<Long>> stageIds = readStages(edition.getStagesJson());

    // Every stage's questions in one query, then split back out by stage.
    List<Long> allIds = stageIds.values().stream().flatMap(List::stream).toList();
    Map<Long, Question> byId = questions.findAllById(allIds).stream()
        .collect(Collectors.toMap(Question::getQuestionId, Function.identity()));

    Map<String, List<ChallengeArenaService.ArenaProblemView>> stages = new LinkedHashMap<>();
    for (int stageIndex = 0; stageIndex < STAGE_IDS.size(); stageIndex++) {
      String stageId = STAGE_IDS.get(stageIndex);
      // A question deleted from the bank since drops out of the stage rather
      // than failing the whole edition.
      List<Question> stageQuestions = stageIds.getOrDefault(stageId, List.of()).stream()
          .map(byId::get)
          .filter(question -> question != null)
          .toList();
      int nodeIndex = stageIndex + 1;
      stages.put(stageId, arenas.viewsOf(stageQuestions, index -> nodeIndex, index -> null));
    }
    return new EditionDetail(summaryOf(edition), stages);
  }

  @Transactional
  public EditionSummary create(CreateEditionRequest request) {
    if (request == null || request.weekStart() == null) {
      throw new IllegalArgumentException("Choose the week this exam runs");
    }
    if (request.certificationId() == null) {
      throw new IllegalArgumentException("Choose the certification this week's bracket runs on");
    }
    if (request.lessonId() == null) {
      throw new IllegalArgumentException("Choose the lesson these questions are filed under");
    }
    if (!certifications.existsById(request.certificationId())) {
      throw new EntityNotFoundException("Certification not found: " + request.certificationId());
    }

    // Any date names its week; the edition is keyed by that week's Monday.
    LocalDate monday = request.weekStart().with(DayOfWeek.MONDAY);
    if (editions.existsByWeekStart(monday)) {
      throw new IllegalArgumentException("An exam already exists for the week of " + monday);
    }

    WorldCupEdition edition = new WorldCupEdition();
    edition.setWeekStart(monday);
    edition.setCertificationId(request.certificationId());
    edition.setLessonId(request.lessonId());
    edition.setStagesJson(ChallengeArenaService.writeJson(emptyStages()));
    edition.setPublished(false);
    edition.setCreatedAt(LocalDateTime.now());
    return summaryOf(editions.save(edition));
  }

  /** Replaces the edition's stage sets. Saving a draft; learners see nothing. */
  @Transactional
  public EditionSummary saveStages(Long editionId, SaveStagesRequest request) {
    WorldCupEdition edition = find(editionId);
    Map<String, List<Long>> stages = emptyStages();

    if (request != null && request.stages() != null) {
      for (Map.Entry<String, List<Long>> entry : request.stages().entrySet()) {
        if (!STAGE_IDS.contains(entry.getKey())) {
          throw new IllegalArgumentException("Unknown bracket stage: " + entry.getKey());
        }
        stages.put(entry.getKey(), entry.getValue() == null ? List.of() : List.copyOf(entry.getValue()));
      }
    }

    List<Long> allIds = stages.values().stream().flatMap(List::stream).toList();
    if (allIds.stream().anyMatch(id -> id == null)) {
      throw new IllegalArgumentException("Every stage question needs to be saved to the bank first");
    }
    long found = questions.findAllById(allIds).size();
    if (found != allIds.stream().distinct().count()) {
      throw new EntityNotFoundException("Some of this week's questions are no longer in the bank");
    }

    edition.setStagesJson(ChallengeArenaService.writeJson(stages));
    edition.setUpdatedAt(LocalDateTime.now());
    return summaryOf(editions.save(edition));
  }

  /**
   * Makes this week's bracket the one learners sit.
   *
   * <p>Every stage must hold questions: a bracket that runs out at the
   * semifinal cannot be played. Earlier editions keep their Published badge as
   * history; the World Cup exam holds only this one's questions.
   */
  @Transactional
  public EditionSummary publish(Long editionId) {
    WorldCupEdition edition = find(editionId);
    Map<String, List<Long>> stages = readStages(edition.getStagesJson());

    List<String> empty = STAGE_IDS.stream()
        .filter(stageId -> stages.getOrDefault(stageId, List.of()).isEmpty())
        .toList();
    if (!empty.isEmpty()) {
      throw new IllegalArgumentException("Every stage needs questions. Empty: " + String.join(", ", empty));
    }

    List<ChallengeArenaService.ArenaProblemRequest> problems = new ArrayList<>();
    for (int stageIndex = 0; stageIndex < STAGE_IDS.size(); stageIndex++) {
      for (Long questionId : stages.get(STAGE_IDS.get(stageIndex))) {
        problems.add(new ChallengeArenaService.ArenaProblemRequest(questionId, stageIndex + 1, null));
      }
    }

    arenas.saveProblems(ARENA_ID, new ChallengeArenaService.SaveArenaProblemsRequest(
        edition.getCertificationId(), null, problems));

    edition.setPublished(true);
    edition.setPublishedAt(LocalDateTime.now());
    edition.setUpdatedAt(LocalDateTime.now());
    log.info("World Cup week {} published with {} question(s)", edition.getWeekStart(), problems.size());
    return summaryOf(editions.save(edition));
  }

  /**
   * Deletes a draft. A published week is history and stays: its questions may
   * be what learners are sitting right now.
   */
  @Transactional
  public void delete(Long editionId) {
    WorldCupEdition edition = find(editionId);
    if (edition.isPublished()) {
      throw new IllegalArgumentException("A published week cannot be deleted");
    }
    editions.delete(edition);
  }

  private WorldCupEdition find(Long editionId) {
    return editions.findById(editionId)
        .orElseThrow(() -> new EntityNotFoundException("Weekly exam not found: " + editionId));
  }

  private EditionSummary summaryOf(WorldCupEdition edition) {
    Map<String, List<Long>> stages = readStages(edition.getStagesJson());
    Map<String, Integer> counts = new LinkedHashMap<>();
    for (String stageId : STAGE_IDS) {
      counts.put(stageId, stages.getOrDefault(stageId, List.of()).size());
    }
    return new EditionSummary(
        edition.getEditionId(),
        edition.getWeekStart(),
        edition.getCertificationId(),
        edition.getLessonId(),
        edition.isPublished(),
        edition.getPublishedAt(),
        counts);
  }

  private static Map<String, List<Long>> emptyStages() {
    Map<String, List<Long>> stages = new LinkedHashMap<>();
    for (String stageId : STAGE_IDS) {
      stages.put(stageId, List.of());
    }
    return stages;
  }

  private static Map<String, List<Long>> readStages(String json) {
    try {
      return json == null ? emptyStages() : JSON.readValue(json, new TypeReference<Map<String, List<Long>>>() {});
    } catch (Exception e) {
      log.warn("Unreadable World Cup stages, treating as empty: {}", e.getMessage());
      return emptyStages();
    }
  }
}
