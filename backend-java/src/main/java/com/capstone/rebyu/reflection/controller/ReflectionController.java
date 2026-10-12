package com.capstone.rebyu.reflection.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.reflection.dto.ReflectionDtos.ReflectionView;
import com.capstone.rebyu.reflection.dto.ReflectionDtos.SubmitRequest;
import com.capstone.rebyu.reflection.service.ReflectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learners/me/reflections")
@RequiredArgsConstructor
public class ReflectionController {

    private final ReflectionService reflectionService;
    private final CognitoAuthService auth;

    @GetMapping("/middle/{middleCategoryId}")
    public ReflectionView view(@PathVariable Long middleCategoryId, @AuthenticationPrincipal Jwt jwt) {
        return reflectionService.view(requireLearner(jwt), middleCategoryId);
    }

    @PostMapping("/middle/{middleCategoryId}/submissions")
    public ReflectionView submit(@PathVariable Long middleCategoryId,
                                 @RequestBody SubmitRequest request,
                                 @AuthenticationPrincipal Jwt jwt) {
        return reflectionService.submit(requireLearner(jwt), middleCategoryId, request.answer());
    }

    private Long requireLearner(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.getLearnerId() == null) {
            throw new IllegalArgumentException("A learner account is required");
        }
        return user.getLearnerId();
    }
}
