package com.capstone.rebyu.progress.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.gamification.RewardService;
import com.capstone.rebyu.progress.dto.LearnerAchievementDto;
import com.capstone.rebyu.progress.dto.LearnerAchievementViewDto;
import com.capstone.rebyu.progress.service.AchievementAwardService;
import com.capstone.rebyu.progress.service.LearnerAchievementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learner-achievements")
@RequiredArgsConstructor
public class LearnerAchievementController {
    private final LearnerAchievementService learnerAchievementService;
    private final AchievementAwardService achievementAwardService;
    private final CognitoAuthService auth;
    private final RewardService rewardService;

    public record MyRewardsDto(Long totalXp, List<LearnerAchievementViewDto> achievements) {}

    @GetMapping("/me")
    public List<LearnerAchievementViewDto> myAchievements(@AuthenticationPrincipal Jwt jwt) {
        return achievementAwardService.catalogFor(me(jwt));
    }

    @GetMapping("/me/rewards")
    public MyRewardsDto myRewards(@AuthenticationPrincipal Jwt jwt) {
        Long learnerId = me(jwt);
        return new MyRewardsDto(rewardService.balance(learnerId).xp(), achievementAwardService.catalogFor(learnerId));
    }


    @GetMapping
    public List<LearnerAchievementDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return learnerAchievementService.getAll();
    }

    @GetMapping("/{learnerId}/{achievementId}")
    public LearnerAchievementDto getById(@AuthenticationPrincipal Jwt jwt,
                                         @PathVariable Long learnerId, @PathVariable Long achievementId) {
        requireAdmin(jwt);
        return learnerAchievementService.getById(learnerId, achievementId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LearnerAchievementDto create(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody LearnerAchievementDto dto) {
        requireAdmin(jwt);
        return learnerAchievementService.create(dto);
    }

    @PutMapping("/{learnerId}/{achievementId}")
    public LearnerAchievementDto update(@AuthenticationPrincipal Jwt jwt,
                                        @PathVariable Long learnerId, @PathVariable Long achievementId,
                                        @Valid @RequestBody LearnerAchievementDto dto) {
        requireAdmin(jwt);
        return learnerAchievementService.update(learnerId, achievementId, dto);
    }

    @DeleteMapping("/{learnerId}/{achievementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt,
                       @PathVariable Long learnerId, @PathVariable Long achievementId) {
        requireAdmin(jwt);
        learnerAchievementService.delete(learnerId, achievementId);
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Admin access is required");
        }
    }

    private Long me(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) {
            throw new IllegalArgumentException("A learner account is required");
        }
        return user.learnerId();
    }
}
