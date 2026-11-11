package com.capstone.rebyu.assessment.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AttemptAnswerReviewDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.ChallengeScoreDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.DiagramElementReviewDto;
import com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.ScoreComponentDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ChallengeScoreBreakdownTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static AttemptAnswerReviewDto review(String credit, String points, Boolean correct,
                                                 List<DiagramElementReviewDto> elements) {
        return new AttemptAnswerReviewDto(1L, 1, "CRITICAL_THINKING", "Conference room planner\n\nText",
                correct, false, new BigDecimal(credit), new BigDecimal(points), null, null, null, null, null,
                null, null, false, "feedback", List.of(), elements, null, null, null, null, null, List.of(), null);
    }

    private static BigDecimal sum(ChallengeScoreDto score) {
        return score.components().stream().map(ScoreComponentDto::points).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Test
    void codeStrikeExplainsA99PercentRun() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 12, 2, 55, 0);
        LocalDateTime end = start.plusMinutes(23).plusSeconds(40);
        var item = new ChallengeScoreBreakdown.Item(review("9.896", "10", true, List.of()),
                "{\"totalTests\":1,\"passedTests\":1,\"executionTimeMs\":120}");

        ChallengeScoreDto score = ChallengeScoreBreakdown.build("codestrike", new BigDecimal("98.96"),
                List.of(item), Map.of("weightCorrect", 60, "weightSpeed", 20, "weightBigO", 20),
                start, end, 45, JSON);

        assertThat(score.components()).extracting(ScoreComponentDto::label)
                .containsExactly("Correctness", "Speed", "Efficiency");
        assertThat(score.components().get(0).points()).isEqualByComparingTo("60");
        assertThat(score.components().get(1).achievedPercent()).isEqualTo(95);
        assertThat(score.components().get(2).points()).isEqualByComparingTo("20");
        assertThat(sum(score)).isEqualByComparingTo("98.96");
        assertThat(score.items()).hasSize(1);
        assertThat(score.items().get(0).title()).isEqualTo("Conference room planner");
    }

    @Test
    void championsCupCountsCorrectAnswers() {
        var right = new ChallengeScoreBreakdown.Item(review("1", "1", true, List.of()), null);
        var wrong = new ChallengeScoreBreakdown.Item(review("0", "1", false, List.of()), null);

        ChallengeScoreDto score = ChallengeScoreBreakdown.build("worldcup", new BigDecimal("66.67"),
                List.of(right, right, wrong), Map.of(), null, null, null, JSON);

        assertThat(score.components()).hasSize(1);
        assertThat(score.components().get(0).detail()).startsWith("2 of 3 questions");
        assertThat(sum(score)).isEqualByComparingTo("66.67");
    }

    @Test
    void blueprintGroupsElementsAndShowsWhatTheyCannotExplain() {
        List<DiagramElementReviewDto> elements = List.of(
                new DiagramElementReviewDto("ENTITY", "Course", true, "EXACT", null, null, new BigDecimal("3"), new BigDecimal("3")),
                new DiagramElementReviewDto("RELATIONSHIP", "offers", false, "MISSING", null, null, BigDecimal.ZERO, new BigDecimal("2")));
        var item = new ChallengeScoreBreakdown.Item(review("4", "10", false, elements), null);

        // Elements explain 60%, but the stored score is 40%: the gap must be shown, not hidden.
        ChallengeScoreDto score = ChallengeScoreBreakdown.build("blueprint", new BigDecimal("40"),
                List.of(item), Map.of(), null, null, null, JSON);

        assertThat(score.components()).extracting(ScoreComponentDto::label)
                .containsExactly("Entities", "Relationships", "Other marking rules");
        assertThat(score.components().get(0).points()).isEqualByComparingTo("60");
        assertThat(sum(score)).isEqualByComparingTo("40");
    }
}
