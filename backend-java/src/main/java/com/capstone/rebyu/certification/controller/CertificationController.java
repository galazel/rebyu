package com.capstone.rebyu.certification.controller;

import com.capstone.rebyu.aigateway.service.CurriculumGenerationService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.certification.dto.CertificationDto;
import com.capstone.rebyu.certification.service.CertificationBadgeService;
import com.capstone.rebyu.certification.service.CertificationService;
import com.capstone.rebyu.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/certifications")
@RequiredArgsConstructor
@Slf4j
public class CertificationController {

    private final CertificationService certificationService;
    private final CurriculumGenerationService curriculumGenerationService;
    private final DepartmentService departmentService;
    private final CognitoAuthService auth;
    private final CertificationBadgeService badgeService;

    @GetMapping
    public List<CertificationDto> getAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long includeDepartmentId,
            @RequestParam(defaultValue = "false") boolean includeComingSoon) {
        requireDepartmentAccessIfRequested(jwt, includeDepartmentId);
        return certificationService.getAll(includeDepartmentId, includeComingSoon);
    }

    @GetMapping("/{id}")
    public CertificationDto getById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(required = false) Long includeDepartmentId) {
        requireDepartmentAccessIfRequested(jwt, includeDepartmentId);
        return certificationService.getById(id, includeDepartmentId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CertificationDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CertificationDto dto) {
        requireAdmin(jwt);
        return certificationService.create(dto);
    }


    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CertificationDto createWithAi(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("data") @Valid CertificationDto dto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestPart(value = "badge", required = false) MultipartFile badge,
            @RequestParam(value = "additionalInstructions", required = false) String additionalInstructions,
            @RequestParam(value = "reviewMode", required = false) String reviewMode,
            @RequestParam(value = "questionTypes", required = false) List<String> questionTypes,
            @RequestParam(value = "questionBankSize", required = false) Integer questionBankSize,
            @RequestParam(value = "lessonCount", required = false) Integer lessonCount
    ) throws IOException {
        CurrentUserDto user = requireAdmin(jwt);
        log.info("AI certification creation requested for '{}' (reviewMode={}, questionTypes={}, bankSize={})",
                dto.getTitle(), reviewMode, questionTypes, questionBankSize);
        CertificationDto created = curriculumGenerationService.generateForNewCertification(
                dto, files, additionalInstructions, user.userId(), reviewMode, questionTypes,
                questionBankSize, lessonCount
        );
        if (badge != null && !badge.isEmpty()) {
            created.setBadgeImageKey(badgeService.replace(created.getCertificationId(), badge));
        }
        return created;
    }

    @GetMapping("/{id}/badge")
    public ResponseEntity<byte[]> badge(@PathVariable Long id) {
        CertificationBadgeService.Badge badge = badgeService.read(id);
        if (badge == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(badge.contentType()))
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(10)))
                .body(badge.bytes());
    }

    @PutMapping(value = "/{id}/badge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public java.util.Map<String, String> setBadge(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestPart("badge") MultipartFile badge) {
        requireAdmin(jwt);
        return java.util.Map.of("badgeImageKey", badgeService.replace(id, badge));
    }

    @DeleteMapping("/{id}/badge")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeBadge(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireAdmin(jwt);
        badgeService.remove(id);
    }

    @PostMapping(value = "/{id}/generate/append", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.ACCEPTED)
    public CertificationDto appendWithAi(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "additionalInstructions", required = false) String additionalInstructions,
            @RequestParam(value = "reviewMode", required = false) String reviewMode,
            @RequestParam(value = "questionTypes", required = false) List<String> questionTypes,
            @RequestParam(value = "questionBankSize", required = false) Integer questionBankSize,
            @RequestParam(value = "lessonCount", required = false) Integer lessonCount
    ) throws IOException {
        CurrentUserDto user = requireAdmin(jwt);
        log.info("AI append requested for certification {} (reviewMode={}, questionTypes={}, bankSize={})",
                id, reviewMode, questionTypes, questionBankSize);
        return curriculumGenerationService.appendToExistingCertification(
                id, files, additionalInstructions, user.userId(), reviewMode, questionTypes,
                questionBankSize, lessonCount
        );
    }

    @PutMapping("/{id}")
    public CertificationDto update(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody CertificationDto dto) {
        requireAdmin(jwt);
        return certificationService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireAdmin(jwt);
        certificationService.delete(id);
        log.info("Deleted certification with ID: {}", id);
    }

    @GetMapping("/{id}/publishing-requirements")
    public com.capstone.rebyu.certification.dto.CertificationPublishRequirementsDto publishingRequirements(
            @PathVariable Long id) {
        return certificationService.getPublishingRequirements(id);
    }

    @PutMapping("/publish/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publishCertification(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireAdmin(jwt);
        certificationService.publish(id);
        log.info("Publish certification with ID: {}", id);
    }

    private CurrentUserDto requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Admin access is required");
        }
        return user;
    }

    private void requireDepartmentAccessIfRequested(Jwt jwt, Long includeDepartmentId) {
        if (includeDepartmentId == null) {
            return;
        }
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        boolean owner = "owner".equalsIgnoreCase(user.departmentHeadRole());
        departmentService.getAccessibleById(includeDepartmentId, user.institutionId(), user.userId(), owner);
    }
}
