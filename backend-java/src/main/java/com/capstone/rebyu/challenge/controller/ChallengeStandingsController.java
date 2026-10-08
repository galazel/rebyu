package com.capstone.rebyu.challenge.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeLeaderboardRow;
import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeRecord;
import com.capstone.rebyu.challenge.service.ChallengeStandingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeStandingsController {

    private final ChallengeStandingsService challengeStandingsService;
    private final CognitoAuthService auth;

    @GetMapping("/leaderboard")
    public List<ChallengeLeaderboardRow> leaderboard(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "10") int limit) {
        return challengeStandingsService.leaderboard(learnerId(jwt), limit);
    }

    @GetMapping("/me/record")
    public ChallengeRecord myRecord(@AuthenticationPrincipal Jwt jwt) {
        Long learnerId = learnerId(jwt);
        if (learnerId == null) {
            throw new IllegalArgumentException("A learner account is required");
        }
        return challengeStandingsService.record(learnerId);
    }

    private Long learnerId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        return user.learnerId();
    }
}
