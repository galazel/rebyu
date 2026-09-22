package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.service.PastPaperImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Importing an official past paper into a certification's question bank.
 *
 * <p>Two endpoints rather than one, because the parse can be wrong in ways
 * only a person notices: the lesson each question is filed under is an
 * embedding match, and a few questions per paper do not survive the PDF's
 * text layer. {@code /parse} writes nothing and returns drafts with their
 * problems named; {@code /import} writes the ones that were approved.
 *
 * <p>Admin-only. These papers are published under terms that permit
 * educational reuse while requiring attribution, so importing them is a
 * curation decision about the whole bank rather than routine authoring.
 */
@RestController
@RequestMapping("/api/ai/past-papers")
@RequiredArgsConstructor
public class PastPaperImportController {

    private final PastPaperImportService pastPaperImportService;

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> parse(
            @RequestParam("certificationId") Long certificationId,
            // What the required source citation is built from -- "2025A_FE-A",
            // "2024S_IP". Collected rather than guessed from the filename: a
            // wrong label misattributes every question in the paper.
            @RequestParam("paperName") String paperName,
            @RequestParam(value = "kind", required = false) String kind,
            @RequestParam("questions") MultipartFile questions,
            @RequestParam("answers") MultipartFile answers) {
        return pastPaperImportService.parse(certificationId, paperName, kind, questions, answers);
    }

    @PostMapping(value = "/import", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> importApproved(@RequestBody Map<String, Object> request) {
        return pastPaperImportService.importApproved(request);
    }
}
