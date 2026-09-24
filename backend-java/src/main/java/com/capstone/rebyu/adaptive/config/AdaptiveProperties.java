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
            "DIAGNOSTIC", 20,
            "KNOWLEDGE_CHECK", 5));

    /**
     * How many items each adaptive type ends on as its final round.
     *
     * <p>The final round is the written, coded and drawn work -- the part that
     * cannot be marked the instant it is answered, so it is served last and
     * graded with the paper. It used to be one number for every assessment,
     * which made a unit exam end on the same two items as a lesson quiz: the
     * bigger the assessment, the smaller the share of it that asked for
     * anything beyond picking an option.
     *
     * <p>Sized to the assessment instead: a quiz closes on 2, a topic exam on
     * 5, a unit exam on 10. Anything not listed falls back to
     * {@link #finalRoundMax}. A type is still capped by what its bank actually
     * holds -- see {@code AdaptiveAttemptService}, which takes the smaller of
     * this and the workspace items available.
     */
    private Map<String, Integer> finalRoundCounts = new LinkedHashMap<>(Map.of(
            "LESSON_QUIZ", 0,
            "MIDDLE_EXAM", 0,
            "MAJOR_EXAM", 0));

    /**
     * The final-round size for a type with no entry above.
     *
     * <p>Zero everywhere by decision (2026-09-23): every assessment is now
     * answered and marked in one pass. The trade is real and worth knowing --
     * a final round is the ONLY way a workspace item reaches a learner, so
     * with these at zero the written and critical-thinking questions in the
     * bank are never served. Raise the entry for a type to bring them back;
     * nothing else has to change.
     */
    private int finalRoundMax = 0;

    /**
     * Bank replenishment: when a learner has met this share of a level's
     * pool, ask the AI pipeline for another batch at that level (see
     * BankReplenishmentService). Best effort; off leaves the bank as authored.
     */
    private boolean replenishEnabled = true;
    private double replenishSeenShare = 0.7;
    /** No second request for the same certification and level within this many hours. */
    private int replenishCooldownHours = 24;
    /** A top-up is at least this many questions, and at least one paper's worth. */
    private int replenishMinBatch = 20;

    /** The next item is drawn at random from this many most-informative candidates. */
    private int randomesqueTopK = 3;

    /** Weight of BKT uncertainty (p(1-p)) against coverage when choosing the next lesson. */
    private double lessonExplorationWeight = 1.0;

    /**
     * On a middle or major exam, this share of the items is drawn from the
     * lessons BKT says the learner is weak on; the rest cover the category.
     */
    private double weakLessonShare = 0.5;
    /** A lesson is "weak" when its BKT mastery is below this. */
    private double weakMasteryThreshold = 0.5;

    /** A scope's bank must hold this many times the item count before the assessment can publish. */
    private double minBankMultiplier = 1.5;

    /** BKT parameter fallbacks, used until the lesson has a trained model. */
    private double defaultPrior = 0.30;
    private double defaultLearn = 0.08;
    private double defaultGuess = 0.25;
    private double defaultSlip = 0.10;

    /** How long a lesson's BKT parameters fetched from the model service are kept. */
    private int bktParamsCacheMinutes = 10;
}
