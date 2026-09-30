package com.capstone.rebyu.gamification.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.gamification.RewardAmounts;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/rewards")
@RequiredArgsConstructor
public class AdminRewardsController {

    private final CognitoAuthService auth;

    public record UpdateRewardsRequest(
            Integer assessmentAttemptedXp,
            Integer assessmentPassedTopupXp,
            Integer assessmentPerfectTopupXp,
            Integer checkAttemptedXp,
            Integer checkPassedTopupXp,
            Integer checkPerfectTopupXp,
            Integer lessonCompletionXp,
            Integer tutorQuizXp,
            Integer tutorQuizCoins,
            Integer communityQuizXp,
            Integer communityQuizCoins,
            Integer flashcardXp,
            Integer flashcardCoins,
            Integer lowScoreThresholdPercent,
            Integer lowScoreMinXp,
            Integer coinsPerAiCredit,
            Integer aiGenerationCost,
            Integer monthlyProAiCredits
    ) {}

    @GetMapping
    public Map<String, Object> getRewards(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return currentValues();
    }

    @PutMapping
    public Map<String, Object> updateRewards(@AuthenticationPrincipal Jwt jwt,
                                              @RequestBody UpdateRewardsRequest r) {
        requireAdmin(jwt);

        if (r.assessmentAttemptedXp() != null)    RewardAmounts.setAssessmentAttemptedXp(r.assessmentAttemptedXp());
        if (r.assessmentPassedTopupXp() != null)  RewardAmounts.setAssessmentPassedTopupXp(r.assessmentPassedTopupXp());
        if (r.assessmentPerfectTopupXp() != null) RewardAmounts.setAssessmentPerfectTopupXp(r.assessmentPerfectTopupXp());
        if (r.checkAttemptedXp() != null)          RewardAmounts.setCheckAttemptedXp(r.checkAttemptedXp());
        if (r.checkPassedTopupXp() != null)        RewardAmounts.setCheckPassedTopupXp(r.checkPassedTopupXp());
        if (r.checkPerfectTopupXp() != null)       RewardAmounts.setCheckPerfectTopupXp(r.checkPerfectTopupXp());
        if (r.lessonCompletionXp() != null)        RewardAmounts.setLessonCompletionXp(r.lessonCompletionXp());
        if (r.tutorQuizXp() != null)               RewardAmounts.setTutorQuizXp(r.tutorQuizXp());
        if (r.tutorQuizCoins() != null)            RewardAmounts.setTutorQuizCoins(r.tutorQuizCoins());
        if (r.communityQuizXp() != null)           RewardAmounts.setCommunityQuizXp(r.communityQuizXp());
        if (r.communityQuizCoins() != null)        RewardAmounts.setCommunityQuizCoins(r.communityQuizCoins());
        if (r.flashcardXp() != null)               RewardAmounts.setFlashcardXp(r.flashcardXp());
        if (r.flashcardCoins() != null)            RewardAmounts.setFlashcardCoins(r.flashcardCoins());
        if (r.lowScoreThresholdPercent() != null)  RewardAmounts.setLowScoreThresholdPercent(r.lowScoreThresholdPercent());
        if (r.lowScoreMinXp() != null)             RewardAmounts.setLowScoreMinXp(r.lowScoreMinXp());
        if (r.coinsPerAiCredit() != null)          RewardAmounts.setCoinsPerAiCredit(r.coinsPerAiCredit());
        if (r.aiGenerationCost() != null)          RewardAmounts.setAiGenerationCost(r.aiGenerationCost());
        if (r.monthlyProAiCredits() != null)       RewardAmounts.setMonthlyProAiCredits(r.monthlyProAiCredits());

        return currentValues();
    }

    private Map<String, Object> currentValues() {
        return Map.ofEntries(
                Map.entry("assessmentAttemptedXp",    RewardAmounts.getAssessmentAttemptedXp()),
                Map.entry("assessmentPassedTopupXp",  RewardAmounts.getAssessmentPassedTopupXp()),
                Map.entry("assessmentPerfectTopupXp", RewardAmounts.getAssessmentPerfectTopupXp()),
                Map.entry("checkAttemptedXp",          RewardAmounts.getCheckAttemptedXp()),
                Map.entry("checkPassedTopupXp",        RewardAmounts.getCheckPassedTopupXp()),
                Map.entry("checkPerfectTopupXp",       RewardAmounts.getCheckPerfectTopupXp()),
                Map.entry("lessonCompletionXp",        RewardAmounts.getLessonCompletionXp()),
                Map.entry("tutorQuizXp",               RewardAmounts.getTutorQuizXp()),
                Map.entry("tutorQuizCoins",            RewardAmounts.getTutorQuizCoins()),
                Map.entry("communityQuizXp",           RewardAmounts.getCommunityQuizXp()),
                Map.entry("communityQuizCoins",        RewardAmounts.getCommunityQuizCoins()),
                Map.entry("flashcardXp",               RewardAmounts.getFlashcardXp()),
                Map.entry("flashcardCoins",            RewardAmounts.getFlashcardCoins()),
                Map.entry("lowScoreThresholdPercent",  RewardAmounts.getLowScoreThresholdPercent()),
                Map.entry("lowScoreMinXp",             RewardAmounts.getLowScoreMinXp()),
                Map.entry("coinsPerAiCredit",          RewardAmounts.getCoinsPerAiCredit()),
                Map.entry("aiGenerationCost",          RewardAmounts.getAiGenerationCost()),
                Map.entry("monthlyProAiCredits",       RewardAmounts.getMonthlyProAiCredits())
        );
    }

    private CurrentUserDto requireAdmin(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required");
        return user;
    }
}
