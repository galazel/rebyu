package com.capstone.rebyu.adaptive.engine;

import com.capstone.rebyu.assessment.service.QuestionStem;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdaptiveItemSelectorTest {

    private static final String STEM = "Choose the correct method to verify that each submitted record "
            + "meets the expected requirements before it enters the final report";
    private static final AdaptiveItemSelector.Settings SETTINGS = new AdaptiveItemSelector.Settings(1.0, 1, false);

    @ParameterizedTest
    @ValueSource(ints = {10, 20, 30})
    void fillsThePaperWithUnusedVariantsWhenNeeded(int count) {
        List<AdaptiveItemSelector.Candidate> pool = new ArrayList<>(IntStream.rangeClosed(1, count)
                .mapToObj(i -> candidate(i, STEM + " " + i))
                .toList());
        pool.add(candidate(count + 1, STEM + " 1"));
        var state = new AdaptiveSessionState();
        var random = new Random(1);

        for (int i = 0; i < count; i++) {
            var selected = AdaptiveItemSelector.select(state, pool, SETTINGS, random, true).orElseThrow().candidate();
            state.getServedQuestionIds().add(selected.questionId());
            state.getServedStems().add(QuestionStem.of(selected.questionText()));
        }

        assertEquals(count, state.getServedQuestionIds().stream().distinct().count());
        assertEquals(count, state.getServedStems().stream().distinct().count());
    }

    @Test
    void prefersDifferentStemsAndKeepsStrictMatchingForOtherAssessments() {
        var state = new AdaptiveSessionState();
        state.getServedStems().add(QuestionStem.of(STEM + " 1"));
        var similar = candidate(2, STEM + " 2");
        var different = candidate(3, "What is a file extension?");
        var random = new Random(1);

        assertEquals(different, AdaptiveItemSelector.select(state, List.of(similar, different),
                SETTINGS, random, true).orElseThrow().candidate());
        assertTrue(AdaptiveItemSelector.select(state, List.of(similar), SETTINGS, random).isEmpty());
    }

    private static AdaptiveItemSelector.Candidate candidate(long id, String text) {
        return new AdaptiveItemSelector.Candidate(id, 1L, "MULTIPLE_CHOICE", text,
                IrtModel.defaultParams("MEDIUM"), false);
    }
}
