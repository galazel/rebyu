package com.capstone.rebyu.adaptive.engine;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IrtModelTest {

    private static final double PRIOR = IrtModel.PRIOR_SIGMA;

    private static double step(double theta, IrtModel.ItemParams item, boolean correct) {
        return IrtModel.update(theta, PRIOR, item, correct).theta();
    }

    private static double step(double theta, IrtModel.ItemParams item, double score) {
        return IrtModel.update(theta, PRIOR, item, score).theta();
    }

    @Test
    void updateMovesUpOnRightAndDownOnWrongAndNarrows() {
        IrtModel.ItemParams average = new IrtModel.ItemParams(1.0, 0.0, 0.0);
        IrtModel.Estimate up = IrtModel.update(0.0, PRIOR, average, true);
        IrtModel.Estimate down = IrtModel.update(0.0, PRIOR, average, false);
        assertTrue(up.theta() > 0.0);
        assertEquals(-up.theta(), down.theta(), 1e-9); // symmetric at a coin-flip item
        assertTrue(up.standardError() < PRIOR);
        assertEquals(up.standardError(), down.standardError(), 1e-9);
    }

    @Test
    void oneConfidentAnswerMovesAboutOneLevelThenSettles() {
        /* From the baseline, one right answer on an average item should be
           enough to make a hard item the more informative next choice
           (theta past the midpoint between the two levels), and the same
           answer late in a paper should move the estimate far less. */
        IrtModel.ItemParams average = new IrtModel.ItemParams(1.0, 0.0, 0.0);
        double first = IrtModel.update(0.0, PRIOR, average, true).theta();
        assertTrue(first > IrtModel.DIFFICULTY_HARD / 2.0, "first right answer: " + first);
        double late = IrtModel.update(0.0, IrtModel.MIN_SIGMA, average, true).theta();
        assertTrue(late < first / 2.0, "late right answer: " + late);
        assertTrue(late > 0.0);
    }

    @Test
    void standardErrorNeverDropsBelowTheFloor() {
        IrtModel.ItemParams average = new IrtModel.ItemParams(1.0, 0.0, 0.0);
        double theta = 0.0, se = PRIOR;
        for (int i = 0; i < 200; i++) {
            IrtModel.Estimate e = IrtModel.update(theta, se, average, i % 2 == 0);
            theta = e.theta();
            se = e.standardError();
        }
        assertEquals(IrtModel.MIN_SIGMA, se, 1e-9);
    }

    @Test
    void aHardItemRightMovesMoreThanAnEasyOne() {
        IrtModel.ItemParams easy = new IrtModel.ItemParams(1.0, IrtModel.DIFFICULTY_EASY, 0.0);
        IrtModel.ItemParams hard = new IrtModel.ItemParams(1.0, IrtModel.DIFFICULTY_HARD, 0.0);
        double afterEasy = step(0.0, easy, true);
        double afterHard = step(0.0, hard, true);
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
        for (int i = 0; i < 100; i++) theta = step(theta, hard, true);
        assertEquals(IrtModel.THETA_MAX, theta, 1e-9);
        for (int i = 0; i < 100; i++) theta = step(theta, easy, false);
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
        assertEquals(IrtModel.PRIOR_SIGMA, none, 1e-9);
        assertTrue(some < none);
        // the prior's precision plus ten coin-flip items' information, never below the floor
        double expected = 1.0 / Math.sqrt(1.0 / (IrtModel.PRIOR_SIGMA * IrtModel.PRIOR_SIGMA) + 10 * 0.25);
        assertEquals(Math.max(IrtModel.MIN_SIGMA, expected), some, 1e-9);
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
        double right = step(0.0, average, true);
        double wrong = step(0.0, average, false);
        double half = step(0.0, average, 0.5);
        assertEquals(0.0, half, 1e-9); // half credit at a coin-flip item: no surprise
        assertTrue(wrong < step(0.0, average, 0.25));
        assertTrue(step(0.0, average, 0.75) < right);
        assertEquals(right, step(0.0, average, 1.0), 1e-9);
        assertEquals(wrong, step(0.0, average, 0.0), 1e-9);
        assertEquals(right, step(0.0, average, 1.7), 1e-9); // scores are clamped
    }
}
