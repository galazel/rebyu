package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.dto.LessonGenerationDraftResponseDto;
import com.capstone.rebyu.aigateway.service.LessonGenerationService;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ai/lessons")
@RequiredArgsConstructor
public class LessonGenerationController {
    /*
     * ADMIN ONLY, AND CHECKED IN CODE. This controller took no Jwt at all and
     * /api/ai/lessons was not among the authenticated paths in SecurityConfig,
     * so /generate was reachable by anyone: an anonymous caller could spend
     * money with the model provider and write drafts into any lesson by id.
     */

    private final LessonGenerationService lessonGenerationService;
    private final RoleGuard guard;

    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LessonGenerationDraftResponseDto generate(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("lessonId") Long lessonId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "additionalInstructions", required = false) String additionalInstructions
    ) throws IOException {
        guard.requireAdmin(jwt);
        return lessonGenerationService.generateDrafts(lessonId, files, additionalInstructions);
    }
}
