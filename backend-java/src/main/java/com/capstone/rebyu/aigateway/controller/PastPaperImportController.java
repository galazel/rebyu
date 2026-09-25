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

/**
 * Importing an official past paper into a certification's question bank.
 *
 * <p>Two endpoints rather than one, because the parse can be wrong in ways
 * only a person notices: the lesson each question is filed under is an
 * embedding match, and a few questions per paper do not survive the PDF's
 * text layer. {@code /parse} writes nothing and returns drafts with their
 * problems named; {@code /import} writes the ones that were approved.
 *
 * <p>ADMIN ONLY, AND CHECKED IN CODE. {@code @PreAuthorize} is NOT relied on
 * here: this application never enables method security, so every
 * {@code @PreAuthorize} in the codebase is inert. Combined with
 * {@code anyRequest().permitAll()} in the security configuration, an endpoint
 * whose only protection was that annotation would be completely open --
 * which these were, briefly, before this check was added. The role is
 * therefore resolved from the caller's token and compared here, and the paths
 * are additionally listed as authenticated in SecurityConfig.
 */
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
            // What the required source citation is built from -- "2025A_FE-A",
            // "2024S_IP". Collected rather than guessed from the filename: a
            // wrong label misattributes every question in the paper.
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

    /**
     * Every question in a PDF of any layout -- other schools' reviewers, two
     * columns, inline answers, an answer-key section -- read by layout
     * analysis and question profiles rather than a generative model. Writes
     * nothing.
     */
    @PostMapping(value = "/read-layout", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> readLayout(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file) {
        requireAdmin(jwt);
        return pastPaperImportService.readLayout(file);
    }

    /**
     * The questions on one page of a document the browser cannot read by its
     * fixed layout (afternoon papers, other formats, scans), read by the
     * EXTRACTION vision model. Writes nothing.
     */
    @PostMapping(value = "/read-page", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> readPage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/read-page", request, "The page could not be read");
    }

    /**
     * Which of a paper's questions are already in the certification's
     * question bank, or repeat an earlier question of the same paper. Writes
     * nothing.
     */
    @PostMapping(value = "/duplicates", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> duplicates(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/duplicates", request, "Duplicates could not be checked");
    }

    /**
     * A lesson and a difficulty for each question, from the TAGGING model
     * (Grok, free models as fallbacks), for the PDF import page's "Tag with
     * AI". Writes nothing.
     */
    @PostMapping(value = "/tag", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> tag(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/tag", request, "Questions could not be tagged");
    }

    /**
     * Starts tagging every paper in the background. Returns the job at once;
     * the page polls it, and the work goes on if the admin leaves the page.
     */
    @PostMapping(value = "/tag-jobs", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> startTagJob(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.forward("/past-papers/tag-jobs", request, "Tagging could not be started");
    }

    /** The certification's most recent tagging job, as {"job": ...} (null when none). */
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

    /** A job id is 32 hex characters; anything else never reaches the AI service's path. */
    private static String safeId(String jobId) {
        if (jobId == null || !jobId.matches("[0-9a-f]{32}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a tagging job id.");
        }
        return jobId;
    }

    /**
     * The lesson each question most likely belongs to, for the PDF import
     * page's "Tag lessons with AI". Writes nothing.
     */
    @PostMapping(value = "/suggest-lessons", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> suggestLessons(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, Object> request) {
        requireAdmin(jwt);
        return pastPaperImportService.suggestLessons(request);
    }

    /**
     * Resolves the caller and refuses anyone who is not an administrator.
     *
     * <p>A missing token is rejected before the role is read, so an
     * unauthenticated request cannot reach the AI service at all.
     */
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
