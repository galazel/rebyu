package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.service.PastPaperImportService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/past-papers")
@RequiredArgsConstructor
public class PastPaperImportController {

    private final PastPaperImportService pastPaperImportService;
    private final CognitoAuthService auth;

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> parse(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("certificationId") Long certificationId,
            @RequestParam("paperName") String paperName,
            @RequestParam(value = "kind", required = false) String kind,
            @RequestParam("questions") MultipartFile questions,
            @RequestParam("answers") MultipartFile answers) {
        requireAdmin(jwt);
        return pastPaperImportService.parse(certificationId, paperName, kind, questions, answers);
    }

    @PostMapping(value = "/import", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> importApproved(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.importApproved(request);
    }

    @PostMapping(value = "/read-layout", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> readLayout(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file) {
        requireAdmin(jwt);
        return pastPaperImportService.readLayout(file);
    }

    @PostMapping(value = "/to-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_PDF_VALUE)
    public byte[] toPdf(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file) {
        requireAdmin(jwt);
        return pastPaperImportService.toPdf(file);
    }

    @PostMapping(value = "/read-page", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> readPage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/read-page", request, "The page could not be read");
    }

    @PostMapping(value = "/duplicates", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> duplicates(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/duplicates", request, "Duplicates could not be checked");
    }

    @PostMapping(value = "/tag", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> tag(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/tag", request, "Questions could not be tagged");
    }

    @PostMapping(value = "/tag-jobs", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> startTagJob(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/tag-jobs", request, "Tagging could not be started");
    }

    @GetMapping("/tag-jobs/latest")
    public Map<String, Object> latestTagJob(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Long certificationId) {
        requireAdmin(jwt);
        return pastPaperImportService.get(
                "/past-papers/tag-jobs/latest?certificationId=" + certificationId, "The tagging job could not be read");
    }

    @GetMapping("/tag-jobs/{jobId}")
    public Map<String, Object> tagJob(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String jobId) {
        requireAdmin(jwt);
        return pastPaperImportService.get("/past-papers/tag-jobs/" + safeId(jobId), "The tagging job could not be read");
    }

    @PostMapping("/tag-jobs/{jobId}/cancel")
    public Map<String, Object> cancelTagJob(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String jobId) {
        requireAdmin(jwt);
        return pastPaperImportService.forward(
                "/past-papers/tag-jobs/" + safeId(jobId) + "/cancel", Map.of(), "Tagging could not be stopped");
    }

    private static String safeId(String jobId) {
        if (jobId == null || !jobId.matches("[0-9a-f]{32}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a tagging job id.");
        }
        return jobId;
    }

    @PostMapping(value = "/suggest-lessons", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> suggestLessons(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.suggestLessons(request);
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication is required.");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        String role = user == null || user.role() == null
                ? "" : user.role().trim().toUpperCase(Locale.ROOT);
        if (!role.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Importing past papers is restricted to administrators.");
        }
    }
}
