package com.capstone.rebyu.certification.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.certification.dto.CertificationDto;
import com.capstone.rebyu.certification.dto.FileDto;
import com.capstone.rebyu.certification.service.LessonImageService;
import com.capstone.rebyu.certification.service.LessonVideoService;
import com.capstone.rebyu.certification.service.S3StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLConnection;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:5173")
@Slf4j
public class FileController {

    private final S3StorageService s3StorageService;
    private final LessonImageService lessonImageService;
    private final LessonVideoService lessonVideoService;
    private final CognitoAuthService auth;

    public FileController(
            S3StorageService s3StorageService,
            LessonImageService lessonImageService,
            LessonVideoService lessonVideoService,
            CognitoAuthService auth
    ) {
        this.s3StorageService = s3StorageService;
        this.lessonImageService = lessonImageService;
        this.lessonVideoService = lessonVideoService;
        this.auth = auth;
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.TEXT_PLAIN_VALUE
    )
    public ResponseEntity<String> upload(
            @ModelAttribute FileDto fileDto,
            @AuthenticationPrincipal Jwt jwt
    ) throws Exception {
        requireAdmin(jwt);
        validateLessonMediaUpload(fileDto);

        String key = s3StorageService.uploadFile(fileDto);

        saveLessonMediaReference(fileDto, key);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(key);
    }

    @PostMapping(
            value = "/upload/certification",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.TEXT_PLAIN_VALUE
    )
    public ResponseEntity<String> uploadCertification(
            @ModelAttribute CertificationDto certificationDto,
            @AuthenticationPrincipal Jwt jwt
    ) throws Exception {
        requireAdmin(jwt);
        log.info("Uploading certification image");

        String key = s3StorageService.uploadFile(certificationDto);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(key);
    }

    /**
     * Largest object {@link #viewFile} will buffer through the application.
     *
     * <p>It reads the whole object into a byte[] and hands that to the response,
     * so the container holds the file twice over for the length of the request.
     * At a few megabytes -- a lesson image, a diagram, a short reviewer -- that
     * is unremarkable. At 81 MB it exhausted the heap and the learner got a 500
     * with nothing to act on. Past this line the answer is a presigned URL
     * (see {@link #viewFileUrl}), which keeps the bytes out of the application
     * altogether; this limit exists so the refusal is an explanation rather
     * than an out-of-memory error.
     */
    private static final long MAX_BUFFERED_VIEW_BYTES = 12L * 1024 * 1024;

    @GetMapping("/view")
    public ResponseEntity<byte[]> viewFile(
            @RequestParam("key") String key,
            @AuthenticationPrincipal Jwt jwt
    ) {
        requireAuth(jwt);

        long size = s3StorageService.contentLength(key);
        if (size > MAX_BUFFERED_VIEW_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "This file is too large to load this way. Open it with /api/files/view-url, "
                            + "which streams it directly from storage.");
        }

        byte[] data = s3StorageService.downloadFile(key);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentTypeOf(key)))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(data);
    }

    /**
     * A short-lived URL the browser can point a viewer straight at.
     *
     * <p>Returned instead of the bytes so that displaying a file costs the
     * application one signature rather than the whole file: the browser streams
     * it from storage itself, with range requests, which is what makes a large
     * PDF open at the first page instead of after the last byte.
     */
    @GetMapping("/view-url")
    public Map<String, Object> viewFileUrl(
            @RequestParam("key") String key,
            @RequestParam(value = "filename", required = false) String filename,
            @AuthenticationPrincipal Jwt jwt
    ) {
        requireAuth(jwt);
        String contentType = contentTypeOf(key);
        String url = s3StorageService.presignViewUrl(
                key,
                filename == null || filename.isBlank() ? getFileName(key) : filename,
                contentType,
                VIEW_URL_TTL);
        return Map.of(
                "url", url,
                "contentType", contentType,
                "expiresInSeconds", VIEW_URL_TTL.toSeconds());
    }

    /**
     * How long a view URL stays good for.
     *
     * <p>Long enough to read a long document without the link dying mid-scroll
     * -- a browser re-requests ranges of a large PDF as the reader pages
     * through it, and every one of those is signed by this same URL. Short
     * enough that a copied link is not a lasting way around the auth on the
     * endpoint that issued it.
     */
    private static final Duration VIEW_URL_TTL = Duration.ofMinutes(30);

    /**
     * The stored file's real media type, so a viewer can render it.
     *
     * <p>{@link URLConnection#guessContentTypeFromName} knows the types that
     * predate it and nothing since: every Office format comes back null, which
     * became {@code application/octet-stream} -- and a browser handed
     * octet-stream downloads the file instead of showing it, whatever the
     * {@code Content-Disposition: inline} above asks for. The formats learners
     * actually share are named here; anything else keeps the old fallback.
     */
    private static String contentTypeOf(String key) {
        String name = key == null ? "" : key.toLowerCase(Locale.ROOT);
        int dot = name.lastIndexOf('.');
        String extension = dot == -1 ? "" : name.substring(dot + 1);

        String known = KNOWN_CONTENT_TYPES.get(extension);
        if (known != null) return known;

        String guessed = URLConnection.guessContentTypeFromName(name);
        return guessed == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : guessed;
    }

    private static final Map<String, String> KNOWN_CONTENT_TYPES = Map.ofEntries(
            Map.entry("pdf", MediaType.APPLICATION_PDF_VALUE),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("doc", "application/msword"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("txt", "text/plain"),
            Map.entry("md", "text/markdown"),
            Map.entry("csv", "text/csv"),
            Map.entry("png", MediaType.IMAGE_PNG_VALUE),
            Map.entry("jpg", MediaType.IMAGE_JPEG_VALUE),
            Map.entry("jpeg", MediaType.IMAGE_JPEG_VALUE),
            Map.entry("gif", MediaType.IMAGE_GIF_VALUE),
            Map.entry("webp", "image/webp"),
            Map.entry("svg", "image/svg+xml"));

    @GetMapping("/download")
    public ResponseEntity<byte[]> download(
            @RequestParam("key") String key,
            @AuthenticationPrincipal Jwt jwt
    ) {
        requireAuth(jwt);
        byte[] data = s3StorageService.downloadFile(key);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + getFileName(key) + "\""
                )
                .body(data);
    }

    // Arbitrary-key deletion is destructive and has no per-owner check at this
    // generic layer (the key alone doesn't identify which lesson/institution/
    // learner it belongs to), so it's restricted to ADMIN rather than left
    // fully public -- previously anyone on the internet could delete any file
    // in the bucket by guessing/observing its key.
    @DeleteMapping
    public ResponseEntity<Void> delete(
            @RequestParam("key") String key,
            @AuthenticationPrincipal Jwt jwt
    ) {
        requireAdmin(jwt);
        s3StorageService.deleteFile(key);

        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required");
    }

    private void requireAuth(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
    }

    private void saveLessonMediaReference(
            FileDto fileDto,
            String key
    ) {
        String folderName = fileDto.getFolderName()
                .trim()
                .toLowerCase(Locale.ROOT);

        if ("photo".equals(folderName)) {
            lessonImageService.saveOrUpdateLessonImage(
                    fileDto.getLessonId(),
                    fileDto.getSectionName(),
                    fileDto.getToolId(),
                    key
            );

            return;
        }

        if ("video".equals(folderName)) {
            lessonVideoService.saveOrUpdateLessonVideo(
                    fileDto.getLessonId(),
                    fileDto.getSectionName(),
                    fileDto.getToolId(),
                    key
            );

            return;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "folderName must be either 'photo' or 'video'."
        );
    }

    private void validateLessonMediaUpload(FileDto fileDto) {
        if (fileDto.getLessonId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "lessonId is required."
            );
        }

        if (
                fileDto.getSectionName() == null ||
                        fileDto.getSectionName().isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "sectionName is required."
            );
        }

        if (
                fileDto.getToolId() == null ||
                        fileDto.getToolId().isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "toolId is required."
            );
        }

        if (
                fileDto.getFolderName() == null ||
                        fileDto.getFolderName().isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "folderName is required."
            );
        }

        if (
                fileDto.getFile() == null ||
                        fileDto.getFile().isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "file is required."
            );
        }
    }

    private String getFileName(String key) {
        int lastSlashIndex = key.lastIndexOf("/");

        if (lastSlashIndex == -1) {
            return key;
        }

        return key.substring(lastSlashIndex + 1);
    }
}