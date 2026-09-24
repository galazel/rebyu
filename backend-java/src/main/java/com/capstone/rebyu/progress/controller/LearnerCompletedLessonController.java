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

/**
 * A learner's record of which lessons they have finished reading.
 *
 * <p>Every route here names a learner id, and until this pass none of them
 * checked whose it was -- nor was the path listed in the security
 * configuration, so the whole table was readable and writable with no token at
 * all. Signing in was not the end of the problem: the id comes from the URL or
 * the request body, so any authenticated learner could mark lessons complete
 * for a classmate, un-complete them, or read their progress by changing a
 * number.
 *
 * <p>The id is therefore resolved through {@link RoleGuard#requireLearnerScope}
 * on every route: a learner may act only as themselves, an administrator may
 * act for anyone. The cross-learner listing is admin-only, because no learner
 * flow reads it and "every learner's progress" is not a learner's to see.
 */
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
        // Overwritten rather than merely validated: the body is the client's,
        // and the token is the only trustworthy statement of who is asking.
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
