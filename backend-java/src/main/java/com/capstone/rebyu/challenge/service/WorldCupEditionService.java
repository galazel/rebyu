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

@Slf4j
@Service
@RequiredArgsConstructor
public class WorldCupEditionService {

  public static final List<String> STAGE_IDS = List.of("quarterfinal", "semifinal", "final");

  private static final String ARENA_ID = "worldcup";
  private static final ObjectMapper JSON = new ObjectMapper();

  private final WorldCupEditionRepository editions;
  private final CertificationRepository certifications;
  private final QuestionRepository questions;
  private final ChallengeArenaService arenas;

  public record EditionSummary(
      Long editionId,
      LocalDate weekStart,
      Long certificationId,
      Long lessonId,
      boolean published,
      LocalDateTime publishedAt,
      Map<String, Integer> stageCounts) {}

  public record EditionDetail(
      EditionSummary edition,
      Map<String, List<ChallengeArenaService.ArenaProblemView>> stages) {}

  public record CreateEditionRequest(LocalDate weekStart, Long certificationId, Long lessonId) {}

  public record SaveStagesRequest(Map<String, List<Long>> stages) {}

  @Transactional(readOnly = true)
  public List<EditionSummary> list() {
    return editions.findAllByOrderByWeekStartDesc().stream().map(this::summaryOf).toList();
  }

  @Transactional(readOnly = true)
  public EditionDetail detail(Long editionId) {
    WorldCupEdition edition = find(editionId);
    Map<String, List<Long>> stageIds = readStages(edition.getStagesJson());

    List<Long> allIds = stageIds.values().stream().flatMap(List::stream).toList();
    Map<Long, Question> byId = questions.findAllById(allIds).stream()
        .collect(Collectors.toMap(Question::getQuestionId, Function.identity()));

    Map<String, List<ChallengeArenaService.ArenaProblemView>> stages = new LinkedHashMap<>();
    for (int stageIndex = 0; stageIndex < STAGE_IDS.size(); stageIndex++) {
      String stageId = STAGE_IDS.get(stageIndex);
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
