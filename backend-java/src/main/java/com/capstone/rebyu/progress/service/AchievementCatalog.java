package com.capstone.rebyu.progress.service;

import java.util.Arrays;
import java.util.Optional;

public enum AchievementCatalog {

    FIRST_STEP("First Step",
            "Complete your first learning activity and take the first step toward your goal."),
    FIRST_QUIZ("First Quiz",
            "Complete your very first quiz and begin your learning journey."),
    FIRST_PERFECT_SCORE("First Perfect Score",
            "Achieve your first perfect score on a quiz or assessment."),
    EXAM_READY("Exam Ready",
            "Complete your preparation and prove you're ready to take the exam."),
    KNOWLEDGE_SEEKER("Knowledge Seeker",
            "Enroll in multiple certifications and expand your knowledge across different fields."),
    FINISHER("Finisher",
            "Complete an entire certification review from start to finish."),
    TOP_ACHIEVER("Top Achiever",
            "Demonstrate outstanding performance and rank among the top learners."),
    REBYU_LEGEND("Rebyu Legend",
            "Unlock every achievement and become a true Rebyu Legend.");

    private final String title;
    private final String description;

    AchievementCatalog(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public String slug() {
        return name().toLowerCase().replace('_', '-');
    }

    public static Optional<AchievementCatalog> byTitle(String title) {
        return Arrays.stream(values())
                .filter(entry -> entry.title.equalsIgnoreCase(title))
                .findFirst();
    }
}
