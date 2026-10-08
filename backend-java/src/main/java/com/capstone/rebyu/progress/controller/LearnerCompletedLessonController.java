package com.capstone.rebyu.progress.controller;

import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.progress.dto.LearnerCompletedLessonDto;
import com.capstone.rebyu.progress.service.LearnerCompletedLessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learner-completed-lessons")
@RequiredArgsConstructor
public class LearnerCompletedLessonController {
    private final LearnerCompletedLessonService learnerCompletedLessonService;
    private final RoleGuard guard;

    @GetMapping
    public List<LearnerCompletedLessonDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return learnerCompletedLessonService.getAll();
    }

    @GetMapping("/{learnerId}/{lessonId}")
    public LearnerCompletedLessonDto getById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long learnerId, @PathVariable Long lessonId) {
        return learnerCompletedLessonService.getById(
                guard.requireLearnerScope(jwt, learnerId), lessonId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LearnerCompletedLessonDto create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody LearnerCompletedLessonDto dto) {
        dto.setLearnerId(guard.requireLearnerScope(jwt, dto.getLearnerId()));
        return learnerCompletedLessonService.create(dto);
    }

    @PutMapping("/{learnerId}/{lessonId}")
    public LearnerCompletedLessonDto update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long learnerId, @PathVariable Long lessonId,
            @Valid @RequestBody LearnerCompletedLessonDto dto) {
        Long scoped = guard.requireLearnerScope(jwt, learnerId);
        dto.setLearnerId(scoped);
        return learnerCompletedLessonService.update(scoped, lessonId, dto);
    }

    @DeleteMapping("/{learnerId}/{lessonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long learnerId, @PathVariable Long lessonId) {
        learnerCompletedLessonService.delete(
                guard.requireLearnerScope(jwt, learnerId), lessonId);
    }
}
