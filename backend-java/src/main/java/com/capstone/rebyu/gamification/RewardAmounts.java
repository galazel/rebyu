package com.capstone.rebyu.gamification;

/**
 * Every XP, coin and AI-credit amount the platform awards or charges.
 * Runtime-configurable via the admin pricing controller; resets to these
 * defaults on restart (persisting to the DB is a future enhancement).
 */
public final class RewardAmounts {
    private RewardAmounts() {}

    // ── Assessment XP (full exams) ──────────────────────────────────────
    private static volatile int assessmentAttemptedXp = 30;
    private static volatile int assessmentPassedTopupXp = 70;
    private static volatile int assessmentPerfectTopupXp = 100;

    // ── Knowledge-check XP (pop-up quizzes, quarter scale) ──────────────
    private static volatile int checkAttemptedXp = 10;
    private static volatile int checkPassedTopupXp = 15;
    private static volatile int checkPerfectTopupXp = 25;

    // ── Lesson & practice XP ────────────────────────────────────────────
    private static volatile int lessonCompletionXp = 100;
    private static volatile int tutorQuizXp = 15;
    private static volatile int tutorQuizCoins = 3;
    private static volatile int communityQuizXp = 20;
    private static volatile int communityQuizCoins = 5;
    private static volatile int flashcardXp = 8;
    private static volatile int flashcardCoins = 1;

    // ── Score thresholds ────────────────────────────────────────────────
    private static volatile int lowScoreThresholdPercent = 50;
    private static volatile int lowScoreMinXp = 3;

    // ── AI credits & coins ──────────────────────────────────────────────
    private static volatile int coinsPerAiCredit = 10;
    private static volatile int aiGenerationCost = 1;
    private static volatile int monthlyProAiCredits = 30;

    // ── Getters ─────────────────────────────────────────────────────────

    public static int getAssessmentAttemptedXp()      { return assessmentAttemptedXp; }
    public static int getAssessmentPassedTopupXp()    { return assessmentPassedTopupXp; }
    public static int getAssessmentPerfectTopupXp()   { return assessmentPerfectTopupXp; }
    public static int getCheckAttemptedXp()            { return checkAttemptedXp; }
    public static int getCheckPassedTopupXp()          { return checkPassedTopupXp; }
    public static int getCheckPerfectTopupXp()         { return checkPerfectTopupXp; }
    public static int getLessonCompletionXp()           { return lessonCompletionXp; }
    public static int getTutorQuizXp()                 { return tutorQuizXp; }
    public static int getTutorQuizCoins()              { return tutorQuizCoins; }
    public static int getCommunityQuizXp()             { return communityQuizXp; }
    public static int getCommunityQuizCoins()          { return communityQuizCoins; }
    public static int getFlashcardXp()                 { return flashcardXp; }
    public static int getFlashcardCoins()              { return flashcardCoins; }
    public static int getLowScoreThresholdPercent()    { return lowScoreThresholdPercent; }
    public static int getLowScoreMinXp()               { return lowScoreMinXp; }
    public static int getCoinsPerAiCredit()            { return coinsPerAiCredit; }
    public static int getAiGenerationCost()            { return aiGenerationCost; }
    public static int getMonthlyProAiCredits()         { return monthlyProAiCredits; }

    // ── Setters ─────────────────────────────────────────────────────────

    public static void setAssessmentAttemptedXp(int v)      { assessmentAttemptedXp = requireNonNegative(v); }
    public static void setAssessmentPassedTopupXp(int v)    { assessmentPassedTopupXp = requireNonNegative(v); }
    public static void setAssessmentPerfectTopupXp(int v)   { assessmentPerfectTopupXp = requireNonNegative(v); }
    public static void setCheckAttemptedXp(int v)            { checkAttemptedXp = requireNonNegative(v); }
    public static void setCheckPassedTopupXp(int v)          { checkPassedTopupXp = requireNonNegative(v); }
    public static void setCheckPerfectTopupXp(int v)         { checkPerfectTopupXp = requireNonNegative(v); }
    public static void setLessonCompletionXp(int v)          { lessonCompletionXp = requireNonNegative(v); }
    public static void setTutorQuizXp(int v)                 { tutorQuizXp = requireNonNegative(v); }
    public static void setTutorQuizCoins(int v)              { tutorQuizCoins = requireNonNegative(v); }
    public static void setCommunityQuizXp(int v)             { communityQuizXp = requireNonNegative(v); }
    public static void setCommunityQuizCoins(int v)          { communityQuizCoins = requireNonNegative(v); }
    public static void setFlashcardXp(int v)                 { flashcardXp = requireNonNegative(v); }
    public static void setFlashcardCoins(int v)              { flashcardCoins = requireNonNegative(v); }
    public static void setLowScoreThresholdPercent(int v)    { lowScoreThresholdPercent = requireNonNegative(v); }
    public static void setLowScoreMinXp(int v)               { lowScoreMinXp = requireNonNegative(v); }
    public static void setCoinsPerAiCredit(int v)            { if (v <= 0) throw new IllegalArgumentException("Must be positive"); coinsPerAiCredit = v; }
    public static void setAiGenerationCost(int v)            { aiGenerationCost = requireNonNegative(v); }
    public static void setMonthlyProAiCredits(int v)         { monthlyProAiCredits = requireNonNegative(v); }

    private static int requireNonNegative(int v) {
        if (v < 0) throw new IllegalArgumentException("Value must be non-negative");
        return v;
    }

    // ── Backward-compatible constants (deprecated, use getters) ─────────

    /** @deprecated use {@link #getTutorQuizXp()} */
    public static final int TUTOR_QUIZ_XP = 15;
    /** @deprecated use {@link #getTutorQuizCoins()} */
    public static final int TUTOR_QUIZ_COINS = 3;
    /** @deprecated use {@link #getCommunityQuizXp()} */
    public static final int COMMUNITY_QUIZ_XP = 20;
    /** @deprecated use {@link #getCommunityQuizCoins()} */
    public static final int COMMUNITY_QUIZ_COINS = 5;
    /** @deprecated use {@link #getFlashcardXp()} */
    public static final int FLASHCARD_XP = 8;
    /** @deprecated use {@link #getFlashcardCoins()} */
    public static final int FLASHCARD_COINS = 1;
    /** @deprecated use {@link #getLowScoreThresholdPercent()} */
    public static final int LOW_SCORE_THRESHOLD_PERCENT = 50;
    /** @deprecated use {@link #getLowScoreMinXp()} */
    public static final int LOW_SCORE_MIN_XP = 3;
    /** @deprecated use {@link #getCoinsPerAiCredit()} */
    public static final int COINS_PER_AI_CREDIT = 10;
    /** @deprecated use {@link #getAiGenerationCost()} */
    public static final int AI_GENERATION_COST = 1;
    /** @deprecated use {@link #getMonthlyProAiCredits()} */
    public static final int MONTHLY_PRO_AI_CREDITS = 30;
}
