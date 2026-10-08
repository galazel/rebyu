package com.capstone.rebyu.challenge.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ChallengeArenaServiceIT {

  private static final Long CODESTRIKE_CERTIFICATION = 2L;
  private static final List<Long> CODESTRIKE_QUESTIONS = List.of(69L);

  private static final Long BLUEPRINT_CERTIFICATION = 2L;
  private static final List<Long> BLUEPRINT_QUESTIONS = List.of(68L);

  @Autowired ChallengeArenaService arenas;
  @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

  @Test
  void configuringAnArenaMakesItRunnable() {
    ChallengeArenaService.ArenaStatus before = arenas.status("codestrike");
    System.out.println("[arena] codestrike before: " + before);

    ChallengeArenaService.ArenaStatus after = arenas.saveProblems(
        "codestrike",
        new ChallengeArenaService.SaveArenaProblemsRequest(
            CODESTRIKE_CERTIFICATION,
            45,
            CODESTRIKE_QUESTIONS.stream()
                .map(id -> new ChallengeArenaService.ArenaProblemRequest(
                    id, 1, new BigDecimal("10")))
                .toList()));

    System.out.println("[arena] codestrike after:  " + after);

    assertTrue(after.configured(), "arena should be configured once it has problems");
    assertEquals(CODESTRIKE_QUESTIONS.size(), after.problemCount());
    assertNotNull(after.examId(), "a configured arena must expose the exam the learner runs");
    assertEquals(CODESTRIKE_CERTIFICATION, after.certificationId());

    var row = jdbc.queryForMap(
        "SELECT e.status, e.target_scope, t.exam_type_text, "
            + "(SELECT count(*) FROM exam_questions q WHERE q.exam_id = e.exam_id) AS problems "
            + "FROM exams e JOIN exam_types t ON t.exam_type_id = e.exam_type_id "
            + "WHERE e.exam_id = ?",
        after.examId());

    assertEquals("CHALLENGE", row.get("exam_type_text"));
    assertEquals("codestrike", row.get("target_scope"));
    assertEquals("PUBLISHED", String.valueOf(row.get("status")));
    assertEquals(
        (long) CODESTRIKE_QUESTIONS.size(), ((Number) row.get("problems")).longValue());

    System.out.println("[arena] exam " + after.examId() + " -> " + row);
  }

  @Test
  void savingTwiceReplacesTheSetRatherThanGrowingIt() {
    arenas.saveProblems("blueprint", request(BLUEPRINT_QUESTIONS));
    ChallengeArenaService.ArenaStatus resaved =
        arenas.saveProblems("blueprint", request(BLUEPRINT_QUESTIONS));

    System.out.println("[arena] blueprint after two identical saves: " + resaved);
    assertEquals(BLUEPRINT_QUESTIONS.size(), resaved.problemCount(),
        "re-saving must replace the set, not append to it");
  }

  @Test
  void clearingAnArenaLocksItAgain() {
    arenas.saveProblems("blueprint", request(BLUEPRINT_QUESTIONS));
    assertTrue(arenas.status("blueprint").configured());

    ChallengeArenaService.ArenaStatus cleared = arenas.clearProblems("blueprint");
    System.out.println("[arena] blueprint cleared: " + cleared);

    assertFalse(cleared.configured(), "an emptied arena is locked for learners again");
    assertEquals(0, cleared.problemCount());
  }

  private static ChallengeArenaService.SaveArenaProblemsRequest request(List<Long> questionIds) {
    return new ChallengeArenaService.SaveArenaProblemsRequest(
        BLUEPRINT_CERTIFICATION,
        60,
        questionIds.stream()
            .map(id -> new ChallengeArenaService.ArenaProblemRequest(id, 1, new BigDecimal("10")))
            .toList());
  }
}
