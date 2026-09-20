package com.capstone.rebyu.adaptive.engine;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IrtModelTest {

    @Test
    void stepMovesUpOnRightAndDownOnWrong() {
        IrtModel.ItemParams average = new IrtModel.ItemParams(1.0, 0.0, 0.0);
        double up = IrtModel.step(0.0, average, true, 0.6);
        double down = IrtModel.step(0.0, average, false, 0.6);
        assertEquals(0.3, up, 1e-9);   // 0.6 * (1 - 0.5)
        assertEquals(-0.3, down, 1e-9);
    }

    @Test
    void aHardItemRightMovesMoreThanAnEasyOne() {
        IrtModel.ItemParams easy = new IrtModel.ItemParams(1.0, IrtModel.DIFFICULTY_EASY, 0.0);
        IrtModel.ItemParams hard = new IrtModel.ItemParams(1.0, IrtModel.DIFFICULTY_HARD, 0.0);
        double afterEasy = IrtModel.step(0.0, easy, true, 0.6);
        double afterHard = IrtModel.step(0.0, hard, true, 0.6);
        assertTrue(afterHard > afterEasy);
        assertTrue(afterEasy > 0.0);
    }

    @Test
    void stepNeverLeavesTheScale() {
        /* Surprising answers all the way: right on hard items climbs, wrong on
           easy items falls. (Missing a hard item at the floor is no surprise,
           so it barely moves -- which is the point of the weighting.) */
        IrtModel.ItemParams hard = new IrtModel.ItemParams(1.0, IrtModel.DIFFICULTY_HARD, 0.0);
        IrtModel.ItemParams easy = new IrtModel.ItemParams(1.0, IrtModel.DIFFICULTY_EASY, 0.0);
        double theta = 0.0;
        for (int i = 0; i < 100; i++) theta = IrtModel.step(theta, hard, true, 0.6);
        assertEquals(IrtModel.THETA_MAX, theta, 1e-9);
        for (int i = 0; i < 100; i++) theta = IrtModel.step(theta, easy, false, 0.6);
        assertEquals(IrtModel.THETA_MIN, theta, 1e-9);
    }

    @Test
    void difficultyLevelsMapToFixedPoints() {
        assertEquals(-1.5, IrtModel.difficultyOf("easy"), 1e-9);
        assertEquals(0.0, IrtModel.difficultyOf("AVERAGE"), 1e-9);
        assertEquals(1.5, IrtModel.difficultyOf("Hard"), 1e-9);
        assertEquals(0.0, IrtModel.difficultyOf(null), 1e-9);
    }

    @Test
    void proficiencyRatingIsTheScaleOnto100() {
        assertEquals(50.0, IrtModel.proficiencyRating(0.0), 1e-9);
        assertEquals(0.0, IrtModel.proficiencyRating(-3.0), 1e-9);
        assertEquals(100.0, IrtModel.proficiencyRating(3.0), 1e-9);
        assertEquals(0.0, IrtModel.proficiencyRating(-9.0), 1e-9);
        assertEquals(100.0, IrtModel.proficiencyRating(9.0), 1e-9);
        assertEquals(75.0, IrtModel.proficiencyRating(1.5), 1e-9);
    }

    @Test
    void proficiencyLabelsFollowTheTiers() {
        assertEquals("Novice", IrtModel.proficiencyLabel(0));
        assertEquals("Novice", IrtModel.proficiencyLabel(24.9));
        assertEquals("Developing", IrtModel.proficiencyLabel(25));
        assertEquals("Developing", IrtModel.proficiencyLabel(49.9));
        assertEquals("Proficient", IrtModel.proficiencyLabel(50));
        assertEquals("Proficient", IrtModel.proficiencyLabel(74.9));
        assertEquals("Advanced", IrtModel.proficiencyLabel(75));
        assertEquals("Advanced", IrtModel.proficiencyLabel(100));
    }

    @Test
    void standardErrorShrinksWithEvidence() {
        IrtModel.ItemParams average = new IrtModel.ItemParams(1.0, 0.0, 0.0);
        List<IrtModel.Response> responses = new ArrayList<>();
        double none = IrtModel.standardError(0.0, responses);
        for (int i = 0; i < 10; i++) responses.add(new IrtModel.Response(average, i % 2 == 0));
        double some = IrtModel.standardError(0.0, responses);
        assertTrue(some < none);
        assertEquals(1.0 / Math.sqrt(10 * 0.25), some, 1e-9);
    }

    @Test
    void informationPeaksNearDifficulty() {
        IrtModel.ItemParams item = new IrtModel.ItemParams(1.5, 0.8, 0.0);
        double at = IrtModel.information(0.8, item);
        assertTrue(at > IrtModel.information(-1.0, item));
        assertTrue(at > IrtModel.information(2.5, item));
    }

    @Test
    void bktMovesTheRightWay() {
        BktModel.Params params = new BktModel.Params(0.3, 0.08, 0.25, 0.10);
        double up = BktModel.update(0.3, true, params);
        double down = BktModel.update(0.3, false, params);
        assertTrue(up > 0.3);
        assertTrue(down < 0.3 + 0.08);
        assertTrue(down < up);
    }

    @Test
    void partialScoreMovesBetweenRightAndWrong() {
        IrtModel.ItemParams average = new IrtModel.ItemParams(1.0, 0.0, 0.0);
        double right = IrtModel.step(0.0, average, true, 0.6);
        double wrong = IrtModel.step(0.0, average, false, 0.6);
        double half = IrtModel.step(0.0, average, 0.5, 0.6);
        assertEquals(0.0, half, 1e-9); // half credit at a coin-flip item: no surprise
        assertTrue(wrong < IrtModel.step(0.0, average, 0.25, 0.6));
        assertTrue(IrtModel.step(0.0, average, 0.75, 0.6) < right);
        assertEquals(right, IrtModel.step(0.0, average, 1.0, 0.6), 1e-9);
        assertEquals(wrong, IrtModel.step(0.0, average, 0.0, 0.6), 1e-9);
        assertEquals(right, IrtModel.step(0.0, average, 1.7, 0.6), 1e-9); // scores are clamped
    }
}
