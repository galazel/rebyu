package com.capstone.rebyu.knowledgecheck.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.knowledgecheck.dto.KnowledgeCheckDtos.CheckKeyItem;
import com.capstone.rebyu.knowledgecheck.dto.KnowledgeCheckDtos.CheckOffer;
import java.util.List;
import com.capstone.rebyu.knowledgecheck.service.LessonKnowledgeCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learners/me/knowledge-checks")
@RequiredArgsConstructor
public class LessonKnowledgeCheckController {

    private final LessonKnowledgeCheckService knowledgeCheckService;
    private final CognitoAuthService auth;

    @GetMapping("/offer")
    public CheckOffer offer(
            @RequestParam Long lessonId,
            @RequestParam(defaultValue = "false") boolean currentLessonOnly,
            @AuthenticationPrincipal Jwt jwt) {
        return knowledgeCheckService.offer(requireLearner(jwt), lessonId, currentLessonOnly);
    }

    @PostMapping
    public CheckOffer create(@RequestBody CreateRequest request, @AuthenticationPrincipal Jwt jwt) {
        return knowledgeCheckService.create(requireLearner(jwt), request.lessonId(), request.currentLessonOnly());
    }

    public record CreateRequest(Long lessonId, boolean currentLessonOnly) {}

    @GetMapping("/{examId}/key")
    public List<CheckKeyItem> key(@PathVariable Long examId, @AuthenticationPrincipal Jwt jwt) {
        return knowledgeCheckService.answerKey(requireLearner(jwt), examId);
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
