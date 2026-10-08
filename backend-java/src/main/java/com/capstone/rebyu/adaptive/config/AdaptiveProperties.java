package com.capstone.rebyu.adaptive.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "adaptive")
public class AdaptiveProperties {

    private boolean enabled = true;

    private Map<String, Integer> itemCounts = new LinkedHashMap<>(Map.of(
            "LESSON_QUIZ", 10,
            "MIDDLE_EXAM", 20,
            "MAJOR_EXAM", 30,
            "MOCK_EXAM", 60,
            "DIAGNOSTIC", 20,
            "KNOWLEDGE_CHECK", 5));

    private Map<String, Integer> finalRoundCounts = new LinkedHashMap<>(Map.of(
            "LESSON_QUIZ", 0,
            "MIDDLE_EXAM", 0,
            "MAJOR_EXAM", 0,
            "DIAGNOSTIC", 0));

    private int finalRoundMax = 0;

    private boolean replenishEnabled = true;
    private double replenishSeenShare = 0.7;
    private int replenishCooldownHours = 24;
    private int replenishMinBatch = 20;

    private int randomesqueTopK = 3;

    private double lessonExplorationWeight = 1.0;

    private double weakLessonShare = 0.5;
    private double weakMasteryThreshold = 0.5;

    private double minBankMultiplier = 1.5;

    private double defaultPrior = 0.30;
    private double defaultLearn = 0.08;
    private double defaultGuess = 0.25;
    private double defaultSlip = 0.10;

    private int bktParamsCacheMinutes = 10;
}
