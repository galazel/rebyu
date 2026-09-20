package com.capstone.rebyu.gamification;

import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import com.capstone.rebyu.gamification.entity.LearnerRewardBalance;
import com.capstone.rebyu.gamification.repository.LearnerRewardBalanceRepository;
import com.capstone.rebyu.gamification.repository.LearnerRewardLedgerRepository;
import com.capstone.rebyu.gamification.repository.LeaderboardRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/** Server-authoritative balances. The append-only ledger makes awards idempotent and auditable. */
@Service
@RequiredArgsConstructor
public class RewardService {
    private final LearnerRewardBalanceRepository balances;
    private final LearnerRewardLedgerRepository ledger;
    private final LearnerEntitlementService entitlements;

    public record Balance(long xp, long coins, int aiCredits) {}
    public record PracticeReward(int xp, int coins, boolean awarded) {}
    public record LeaderboardEntry(int rank, Long learnerId, String learnerName, long xp, boolean currentLearner) {}
    public record Conversion(Balance balance, int aiCreditsReceived, boolean converted) {}
    public record LedgerEntry(String currency, int amount, String reason, OffsetDateTime createdAt) {}

    public Balance balance(Long learnerId) {
        ensureBalance(learnerId);
        grantMonthlyProAiCredits(learnerId);
        return toBalance(balances.findById(learnerId).orElseThrow());
    }

    /** One configurable-size grant per active Pro learner per calendar month. */
    @Transactional
    public void grantMonthlyProAiCredits(Long learnerId) {
        if (!entitlements.hasActiveProSubscription(learnerId)) return;
        ensureBalance(learnerId);
        int amount = RewardAmounts.MONTHLY_PRO_AI_CREDITS;
        if (amount <= 0) return;
        String key = "pro-monthly-ai-credit:" + YearMonth.now();
        int created = ledger.insertIfAbsent(learnerId, "AI_CREDITS", amount, "PRO_MONTHLY_GRANT", key);
        if (created > 0) balances.addAiCredits(learnerId, amount);
    }

    @Transactional
    public Conversion convertCoinsToAiCredits(Long learnerId, int coins, String idempotencyKey) {
        int rate = RewardAmounts.COINS_PER_AI_CREDIT;
        if (coins <= 0 || coins % rate != 0) {
            throw new IllegalArgumentException("Convert coins in multiples of " + rate);
        }
        if (idempotencyKey == null || idempotencyKey.isBlank()) throw new IllegalArgumentException("An idempotency key is required");
        ensureBalance(learnerId);
        String key = "coin-to-ai:" + idempotencyKey.trim();
        int debitCreated = ledger.insertIfAbsent(learnerId, "COINS", -coins, "COIN_TO_AI_CONVERSION", key);
        if (debitCreated == 0) return new Conversion(balance(learnerId), 0, false);
        int deducted = balances.deductCoinsIfSufficient(learnerId, coins);
        if (deducted == 0) throw new IllegalArgumentException("You do not have enough coins");
        int credits = coins / rate;
        ledger.insertIfAbsent(learnerId, "AI_CREDITS", credits, "COIN_TO_AI_CONVERSION", key);
        balances.addAiCredits(learnerId, credits);
        return new Conversion(balance(learnerId), credits, true);
    }

    /** Charges the configured AI-generation cost per idempotency key. Returns false when already charged. */
    @Transactional
    public boolean spendAiCredit(Long learnerId, String requestKey) {
        ensureBalance(learnerId);
        grantMonthlyProAiCredits(learnerId);
        int cost = RewardAmounts.AI_GENERATION_COST;
        String key = "ai-generation:" + (requestKey == null || requestKey.isBlank() ? UUID.randomUUID() : requestKey.trim());
        int created = ledger.insertIfAbsent(learnerId, "AI_CREDITS", -cost, "AI_GENERATION", key);
        if (created == 0) return false;
        if (cost <= 0) return true;
        int deducted = balances.deductAiCreditsIfSufficient(learnerId, cost);
        if (deducted == 0) throw new IllegalArgumentException("You need at least " + cost + " AI Credit(s) to generate a study aid");
        return true;
    }

    @Transactional
    public void refundAiCredit(Long learnerId, String requestKey) {
        if (requestKey == null || requestKey.isBlank()) return;
        int amount = RewardAmounts.AI_GENERATION_COST;
        if (amount <= 0) return;
        String original = "ai-generation:" + requestKey.trim();
        String refund = "ai-refund:" + requestKey.trim();
        int created = ledger.insertRefundIfOriginalExists(learnerId, amount, refund, original);
        if (created > 0) balances.addAiCredits(learnerId, amount);
    }

    public List<LeaderboardEntry> leaderboard(Long viewerLearnerId, String scope, String period) {
        boolean community = "community".equalsIgnoreCase(scope);
        OffsetDateTime cutoff = "week".equalsIgnoreCase(period) ? OffsetDateTime.now().minusWeeks(1)
                : "month".equalsIgnoreCase(period) ? OffsetDateTime.now().minusMonths(1) : null;
        List<LeaderboardRow> rows;
        if (community) {
            rows = cutoff == null ? ledger.communityLeaderboardAllTime(viewerLearnerId)
                    : ledger.communityLeaderboardSince(viewerLearnerId, cutoff);
        } else {
            rows = cutoff == null ? ledger.overallLeaderboardAllTime(viewerLearnerId)
                    : ledger.overallLeaderboardSince(viewerLearnerId, cutoff);
        }
        return rows.stream()
                .map(r -> new LeaderboardEntry(r.getRanking(), r.getLearnerId(), r.getLearnerName(), r.getXp(), r.getCurrentLearner()))
                .toList();
    }

    public List<LedgerEntry> recentLedger(Long learnerId) {
        return ledger.findTop20ByLearnerIdOrderByCreatedAtDesc(learnerId).stream()
                .map(e -> new LedgerEntry(e.getCurrency(), e.getAmount(), e.getReason(), e.getCreatedAt()))
                .toList();
    }

    @Transactional
    public PracticeReward awardCompletedPractice(Long learnerId, Long studySetId, String sourceType, double percentage) {
        int xp = "COMMUNITY_QUIZ".equals(sourceType) ? RewardAmounts.COMMUNITY_QUIZ_XP
                : "FLASHCARD_RECALL".equals(sourceType) ? RewardAmounts.FLASHCARD_XP : RewardAmounts.TUTOR_QUIZ_XP;
        int coins = "COMMUNITY_QUIZ".equals(sourceType) ? RewardAmounts.COMMUNITY_QUIZ_COINS
                : "FLASHCARD_RECALL".equals(sourceType) ? RewardAmounts.FLASHCARD_COINS : RewardAmounts.TUTOR_QUIZ_COINS;
        if (percentage < RewardAmounts.LOW_SCORE_THRESHOLD_PERCENT) {
            xp = Math.max(RewardAmounts.LOW_SCORE_MIN_XP, xp / 2);
            coins = 0;
        }
        String key = "practice-set:" + sourceType + ":" + studySetId;
        ensureBalance(learnerId);
        int xpCreated = ledger.insertIfAbsent(learnerId, "XP", xp, "PRACTICE_COMPLETED", key);
        if (xpCreated == 0) return new PracticeReward(0, 0, false);
        if (coins > 0) {
            ledger.insertIfAbsent(learnerId, "COINS", coins, "PRACTICE_COMPLETED", key);
        }
        balances.addXpAndCoins(learnerId, xp, coins);
        return new PracticeReward(xp, coins, true);
    }

    /**
     * Flat-amount XP award for a one-off milestone (lesson completion, assessment
     * completion, ...). Idempotent on {@code sourceKey}: a caller that fires
     * twice for the same key (e.g. a retried request, or a lesson re-marked
     * complete) only ever credits the balance once.
     *
     * @return whether this call actually credited XP, or was a no-op duplicate
     */
    @Transactional
    public boolean awardXp(Long learnerId, int xp, String reason, String sourceKey) {
        if (xp <= 0) return false;
        ensureBalance(learnerId);
        int created = ledger.insertIfAbsent(learnerId, "XP", xp, reason, sourceKey);
        if (created == 0) return false;
        balances.addXpAndCoins(learnerId, xp, 0);
        return true;
    }

    private void ensureBalance(Long learnerId) {
        balances.ensureExists(learnerId);
    }

    private static Balance toBalance(LearnerRewardBalance b) {
        return new Balance(b.getXpBalance(), b.getCoinBalance(), b.getAiCreditBalance());
    }
}
