package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.dto.KnowledgeDocumentDto;
import com.capstone.rebyu.aigateway.entity.KnowledgeDocument;
import com.capstone.rebyu.aigateway.service.DocumentIngestionService;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ai/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentIngestionService documentIngestionService;
    private final RoleGuard guard;

    /**
     * Admits only administrators, to every handler on this controller.
     *
     * <p>A {@code @ModelAttribute} method runs before each handler in its
     * own controller, so a handler added later is covered without anyone
     * remembering to guard it. This class previously took no {@code Jwt}
     * at all and {@code /api/ai/documents} was not listed in SecurityConfig,
     * so the whole knowledge corpus was public: listable, uploadable and
     * DELETABLE by anyone. It is the retrieval corpus the AI tutor answers
     * from, so planting a document there edits what the tutor teaches.
     */
    @ModelAttribute
    void requireAdmin(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
    }

    @GetMapping
    public List<KnowledgeDocumentDto> getAll() {
        return documentIngestionService.getAll();
    }

    @GetMapping("/{id}")
    public KnowledgeDocumentDto getById(@PathVariable Long id) {
        return documentIngestionService.getById(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public List<KnowledgeDocumentDto> upload(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("certificationId") Long certificationId,
            @RequestParam("useCase") KnowledgeDocument.UseCase useCase
    ) throws IOException {
        return documentIngestionService.ingestAll(files, certificationId, useCase);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        documentIngestionService.delete(id);
    }
}
