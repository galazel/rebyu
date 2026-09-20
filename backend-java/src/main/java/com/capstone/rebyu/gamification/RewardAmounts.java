package com.capstone.rebyu.gamification;

/**
 * The XP, coin and AI-credit amounts the platform awards or charges. Fixed
 * here: the admin-editable settings row that used to hold them was never
 * surfaced in the portal, so a table and an endpoint guarded one row nobody
 * changed.
 */
public final class RewardAmounts {
    private RewardAmounts() {
    }

    public static final int TUTOR_QUIZ_XP = 15;
    public static final int TUTOR_QUIZ_COINS = 3;
    public static final int COMMUNITY_QUIZ_XP = 20;
    public static final int COMMUNITY_QUIZ_COINS = 5;
    public static final int FLASHCARD_XP = 8;
    public static final int FLASHCARD_COINS = 1;
    /** Below this score only the minimum XP is paid and no coins. */
    public static final int LOW_SCORE_THRESHOLD_PERCENT = 50;
    public static final int LOW_SCORE_MIN_XP = 3;
    public static final int COINS_PER_AI_CREDIT = 10;
    public static final int AI_GENERATION_COST = 1;
    public static final int MONTHLY_PRO_AI_CREDITS = 30;
}
