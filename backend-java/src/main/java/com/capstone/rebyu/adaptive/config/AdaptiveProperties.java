package com.capstone.rebyu.adaptive.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Tuning for the IRT + BKT adaptive assessment engine. Everything the engine
 * decides by number lives here so a change of policy is a config change.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "adaptive")
public class AdaptiveProperties {

    /** Master switch. When false every assessment runs its fixed question list. */
    private boolean enabled = true;

    /** How many questions each adaptive assessment type serves. */
    private Map<String, Integer> itemCounts = new LinkedHashMap<>(Map.of(
            "LESSON_QUIZ", 10,
            "MIDDLE_EXAM", 20,
            "MAJOR_EXAM", 30,
            "MOCK_EXAM", 60,
            "DIAGNOSTIC", 20));

    /** At most this many programming/diagram items, served last as the final round. */
    private int finalRoundMax = 2;

    /** The next item is drawn at random from this many most-informative candidates. */
    private int randomesqueTopK = 3;

    /** Weight of BKT uncertainty (p(1-p)) against coverage when choosing the next lesson. */
    private double lessonExplorationWeight = 1.0;

    /** Learning rate for online difficulty updates on items never calibrated. */
    private double onlineKDifficulty = 0.30;

    /** Learning rate for online difficulty updates on calibrated items. */
    private double calibratedKDifficulty = 0.075;

    /** A scope's bank must hold this many times the item count before the assessment can publish. */
    private double minBankMultiplier = 1.5;

    /** BKT parameter fallbacks, used until the lesson has a trained model. */
    private double defaultPrior = 0.30;
    private double defaultLearn = 0.08;
    private double defaultGuess = 0.25;
    private double defaultSlip = 0.10;

    /** How long a lesson's BKT parameters fetched from the model service are kept. */
    private int bktParamsCacheMinutes = 10;

    /** The calibration service (FastAPI) base URL for the IRT routes. */
    private String irtServiceUrl = "http://localhost:8000/api/v1/irt";
}
