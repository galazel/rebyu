package com.capstone.rebyu.adaptive.engine;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IrtModelTest {

    @Test
    void eapRecoversAbilityFromSimulatedResponses() {
        Random random = new Random(7);
        double trueTheta = 1.2;
        List<IrtModel.Response> responses = new ArrayList<>();
        for (int i = 0; i < 60; i++) {
            IrtModel.ItemParams item = new IrtModel.ItemParams(1.0 + random.nextDouble(), random.nextGaussian(), 0.2);
            boolean correct = random.nextDouble() < IrtModel.probability(trueTheta, item);
            responses.add(new IrtModel.Response(item, correct));
        }
        IrtModel.Estimate estimate = IrtModel.estimateEap(0.0, 1.0, responses);
        assertEquals(trueTheta, estimate.theta(), 0.45);
        assertTrue(estimate.standardError() < 0.5);
    }

    @Test
    void noResponsesReturnsThePrior() {
        IrtModel.Estimate estimate = IrtModel.estimateEap(0.6, 1.0, List.of());
        assertEquals(0.6, estimate.theta(), 0.02);
        assertEquals(1.0, estimate.standardError(), 0.05);
    }

    @Test
    void informationPeaksNearDifficulty() {
        IrtModel.ItemParams item = new IrtModel.ItemParams(1.5, 0.8, 0.0);
        double at = IrtModel.information(0.8, item);
        assertTrue(at > IrtModel.information(-1.0, item));
        assertTrue(at > IrtModel.information(2.5, item));
    }

    @Test
    void onlineUpdateMovesDifficultyAgainstSurprise() {
        IrtModel.ItemParams item = new IrtModel.ItemParams(1.0, 0.0, 0.0);
        assertTrue(IrtModel.updateDifficulty(item, -2.0, true, 0.3).b() < 0.0);
        assertTrue(IrtModel.updateDifficulty(item, 2.0, false, 0.3).b() > 0.0);
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
}
