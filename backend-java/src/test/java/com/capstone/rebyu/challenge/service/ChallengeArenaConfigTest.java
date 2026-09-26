package com.capstone.rebyu.challenge.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.mapper.QuestionMapper;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.challenge.entity.ChallengeArenaConfig;
import com.capstone.rebyu.challenge.entity.WorldCupEdition;
import com.capstone.rebyu.challenge.repository.ChallengeArenaConfigRepository;
import com.capstone.rebyu.challenge.repository.WorldCupEditionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Arena settings, node layout and World Cup editions -- with every repository
 * mocked, so nothing here reaches the live database the ITs boot against.
 */
@ExtendWith(MockitoExtension.class)
class ChallengeArenaConfigTest {

  @Mock ExamRepository exams;
  @Mock ExamTypeRepository examTypes;
  @Mock ExamQuestionRepository examQuestions;
  @Mock QuestionRepository questions;
  @Mock CertificationRepository certifications;
  @Mock ChallengeArenaConfigRepository configs;
  @Mock QuestionMapper questionMapper;
  @Mock WorldCupEditionRepository editionRepo;

  ChallengeArenaService arenas;
  WorldCupEditionService editions;

  /** A tiny in-memory config table, so a save can be read back. */
  final Map<String, ChallengeArenaConfig> configTable = new HashMap<>();

  @BeforeEach
  void setUp() {
    arenas = new ChallengeArenaService(
        exams, examTypes, examQuestions, questions, certifications, configs, questionMapper);
    editions = new WorldCupEditionService(editionRepo, certifications, questions, arenas);

    lenient().when(configs.findById(anyString()))
        .thenAnswer(inv -> Optional.ofNullable(configTable.get(inv.<String>getArgument(0))));
    lenient().when(configs.save(any())).thenAnswer(inv -> {
      ChallengeArenaConfig config = inv.getArgument(0);
      configTable.put(config.getArenaId(), config);
      return config;
    });
    lenient().when(exams.findAll()).thenReturn(List.of());
  }

  @Test
  void settingsFallBackToDefaults() {
    Map<String, Integer> settings = arenas.status("codestrike").settings();
    assertEquals(10, settings.get("problems"));
    assertEquals(45, settings.get("timeLimit"));
    assertEquals(60, settings.get("weightCorrect"));
  }

  @Test
  void savedSettingsReadBackAndReachTheExamTimer() {
    Exam exam = arenaExam("codestrike");
    when(exams.findAll()).thenReturn(List.of(exam));

    var status = arenas.saveSettings("codestrike",
        Map.of("timeLimit", 30, "weightCorrect", 50, "weightSpeed", 25, "weightBigO", 25));

    assertEquals(30, status.settings().get("timeLimit"));
    assertEquals(50, status.settings().get("weightCorrect"));
    assertEquals(10, status.settings().get("problems"), "untouched keys keep their value");
    assertEquals(30, exam.getDurationMinutes(), "the run is timed from the exam");
  }

  @Test
  void aPausedArenaIsNotConfiguredForLearners() {
    Exam exam = arenaExam("blueprint");
    when(exams.findAll()).thenReturn(List.of(exam));
    ExamQuestion row = new ExamQuestion();
    when(examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(anyLong())).thenReturn(List.of(row));

    assertTrue(arenas.status("blueprint").configured(), "live by default");

    var paused = arenas.setLive("blueprint", false);
    assertFalse(paused.configured());
    assertFalse(paused.live());
    assertEquals(1, paused.problemCount(), "pausing keeps the problems");

    assertTrue(arenas.setLive("blueprint", true).configured());
  }

  @Test
  void disabledTracksAreStoredAndUnknownOnesRefused() {
    when(certifications.existsById(3L)).thenReturn(true);
    when(certifications.existsById(9L)).thenReturn(false);

    assertEquals(List.of(3L), arenas.setDisabledTracks(List.of(3L, 3L)).disabledTrackIds());
    assertThrows(Exception.class, () -> arenas.setDisabledTracks(List.of(9L)));
    assertEquals(List.of(), arenas.setDisabledTracks(List.of()).disabledTrackIds());
  }

  @Test
  void weightsMustTotalOneHundred() {
    var error = assertThrows(IllegalArgumentException.class, () ->
        arenas.saveSettings("codestrike", Map.of("weightCorrect", 70)));
    assertTrue(error.getMessage().contains("110"));
  }

  @Test
  void unknownKeysAndOutOfRangeValuesAreRefused() {
    assertThrows(IllegalArgumentException.class, () ->
        arenas.saveSettings("blueprint", Map.of("weightCorrect", 60)));
    assertThrows(IllegalArgumentException.class, () ->
        arenas.saveSettings("blueprint", Map.of("timeLimit", -5)));
    assertThrows(IllegalArgumentException.class, () ->
        arenas.saveSettings("worldcup", Map.of("lobbySize", 6)));
  }

  @Test
  void problemsKeepTheirNodeAndPoints() {
    Exam exam = arenaExam("codestrike");
    when(exams.findAll()).thenReturn(List.of(exam));
    when(certifications.findById(1L)).thenReturn(Optional.of(certification(1L)));
    when(exams.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(questions.findAllById(any())).thenReturn(List.of(question(11L), question(12L), question(13L)));

    List<ExamQuestion> rows = new ArrayList<>();
    when(examQuestions.save(any())).thenAnswer(inv -> {
      rows.add(inv.getArgument(0));
      return inv.getArgument(0);
    });
    when(examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(anyLong())).thenAnswer(inv -> rows);

    arenas.saveProblems("codestrike", new ChallengeArenaService.SaveArenaProblemsRequest(1L, null, List.of(
        new ChallengeArenaService.ArenaProblemRequest(11L, 1, new BigDecimal("10")),
        new ChallengeArenaService.ArenaProblemRequest(12L, 1, new BigDecimal("15")),
        new ChallengeArenaService.ArenaProblemRequest(13L, 2, new BigDecimal("20")))));

    assertEquals(45, exam.getDurationMinutes(), "no limit in the request uses the saved setting");
    assertEquals(new BigDecimal("15"), rows.get(1).getPoints());

    var views = arenas.problems("codestrike");
    assertEquals(List.of(1, 1, 2), views.stream().map(ChallengeArenaService.ArenaProblemView::nodeIndex).toList());
    assertEquals(List.of(11L, 12L, 13L), views.stream().map(ChallengeArenaService.ArenaProblemView::questionId).toList());
  }

  @Test
  void anEditionIsKeyedByItsMondayAndPublishesStageByStage() {
    when(certifications.existsById(1L)).thenReturn(true);
    ArgumentCaptor<WorldCupEdition> saved = ArgumentCaptor.forClass(WorldCupEdition.class);
    when(editionRepo.save(saved.capture())).thenAnswer(inv -> {
      WorldCupEdition edition = inv.getArgument(0);
      if (edition.getEditionId() == null) edition.setEditionId(7L);
      return edition;
    });

    // A Thursday names the week that started on Monday the 21st.
    var summary = editions.create(new WorldCupEditionService.CreateEditionRequest(
        LocalDate.of(2026, 9, 24), 1L, 5L));
    assertEquals(LocalDate.of(2026, 9, 21), summary.weekStart());

    WorldCupEdition edition = saved.getValue();
    when(editionRepo.findById(7L)).thenReturn(Optional.of(edition));

    // Publishing with an empty stage is refused.
    assertThrows(IllegalArgumentException.class, () -> editions.publish(7L));

    when(questions.findAllById(any())).thenAnswer(inv -> {
      List<Question> found = new ArrayList<>();
      for (Long id : inv.<Iterable<Long>>getArgument(0)) found.add(question(id));
      return found;
    });
    editions.saveStages(7L, new WorldCupEditionService.SaveStagesRequest(Map.of(
        "quarterfinal", List.of(21L, 22L),
        "semifinal", List.of(23L),
        "final", List.of(24L))));

    // Publish writes the World Cup exam: stage order, stage as node index.
    when(certifications.findById(1L)).thenReturn(Optional.of(certification(1L)));
    ExamType challenge = new ExamType();
    challenge.setExamTypeText("CHALLENGE");
    when(examTypes.findByExamTypeText("CHALLENGE")).thenReturn(Optional.of(challenge));
    when(exams.save(any())).thenAnswer(inv -> {
      Exam exam = inv.getArgument(0);
      exam.setExamId(99L);
      return exam;
    });
    List<ExamQuestion> rows = new ArrayList<>();
    when(examQuestions.save(any())).thenAnswer(inv -> {
      rows.add(inv.getArgument(0));
      return inv.getArgument(0);
    });

    var published = editions.publish(7L);
    assertTrue(published.published());
    assertEquals(List.of(21L, 22L, 23L, 24L),
        rows.stream().map(row -> row.getQuestion().getQuestionId()).toList());
    assertEquals("[1,1,2,3]", configTable.get("worldcup").getNodeLayoutJson());
    assertEquals(Map.of("quarterfinal", 2, "semifinal", 1, "final", 1), published.stageCounts());
  }

  private static Exam arenaExam(String arenaId) {
    ExamType type = new ExamType();
    type.setExamTypeText("CHALLENGE");
    Exam exam = new Exam();
    exam.setExamId(50L);
    exam.setExamType(type);
    exam.setTargetScope(arenaId);
    return exam;
  }

  private static Certification certification(Long id) {
    Certification certification = new Certification();
    certification.setCertificationId(id);
    return certification;
  }

  private static Question question(Long id) {
    Question question = new Question();
    question.setQuestionId(id);
    return question;
  }
}
