package com.capstone.rebyu.certification.controller;

import com.capstone.rebyu.aigateway.TutorSnips;
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

    private static final long MAX_QUESTION_IMAGE_BYTES = 5L * 1024 * 1024;

    @PostMapping(
            value = "/upload/question-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.TEXT_PLAIN_VALUE
    )
    public ResponseEntity<String> uploadQuestionImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal Jwt jwt
    ) throws Exception {
        requireAdmin(jwt);
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An image file is required.");
        }
        if (file.getSize() > MAX_QUESTION_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Question images must be 5 MB or smaller.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!contentType.equals("image/png") && !contentType.equals("image/jpeg")
                && !contentType.equals("image/webp") && !contentType.equals("image/gif")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Question images must be PNG, JPEG, WebP or GIF.");
        }

        String key = s3StorageService.uploadFile(file, "question-images");
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(key);
    }

    private static final long MAX_BUFFERED_VIEW_BYTES = 40L * 1024 * 1024;

    @GetMapping("/view")
    public ResponseEntity<byte[]> viewFile(
            @RequestParam("key") String key,
            @AuthenticationPrincipal Jwt jwt
    ) {
        requireAuth(jwt);
        requireSnipOwner(jwt, key);

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

    @GetMapping("/view-url")
    public Map<String, Object> viewFileUrl(
            @RequestParam("key") String key,
            @RequestParam(value = "filename", required = false) String filename,
            @AuthenticationPrincipal Jwt jwt
    ) {
        requireAuth(jwt);
        requireSnipOwner(jwt, key);
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

    private static final Duration VIEW_URL_TTL = Duration.ofMinutes(30);

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
        requireSnipOwner(jwt, key);
        byte[] data = s3StorageService.downloadFile(key);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + getFileName(key) + "\""
                )
                .body(data);
    }

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

    private void requireSnipOwner(Jwt jwt, String key) {
        if (!TutorSnips.isSnip(key)) return;
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!TutorSnips.canView(key, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This picture belongs to someone else.");
        }
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