package com.capstone.rebyu.gamification.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.certification.service.S3StorageService;
import com.capstone.rebyu.gamification.entity.CertificationReviewLevel;
import com.capstone.rebyu.gamification.service.CertificationReviewLevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Set;

@RestController @RequiredArgsConstructor
public class CertificationReviewLevelController {
    private final CertificationReviewLevelService levels;
    private final CognitoAuthService auth;
    private final S3StorageService storage;
    public record LevelDto(Long id, int levelNumber, String title, long requiredXp, String description, String imageKey) {
        static LevelDto of(CertificationReviewLevel row) { return new LevelDto(row.getId(), row.getLevelNumber(), row.getTitle(), row.getRequiredXp(), row.getDescription(), row.getImageKey()); }
        CertificationReviewLevel entity() { return CertificationReviewLevel.builder().levelNumber(levelNumber).title(title == null ? "" : title.trim()).requiredXp(requiredXp).description(description == null ? "" : description.trim()).imageKey(imageKey).build(); }
    }
    @GetMapping("/api/certification-review-levels")
    public List<LevelDto> list() { return levels.all().stream().map(LevelDto::of).toList(); }
    @PutMapping("/api/admin/certification-review-levels")
    public List<LevelDto> replace(@AuthenticationPrincipal Jwt jwt, @RequestBody List<LevelDto> body) { requireAdmin(jwt); return levels.replace(body.stream().map(LevelDto::entity).toList()).stream().map(LevelDto::of).toList(); }
    @PostMapping("/api/admin/certification-review-levels/{levelNumber}/image")
    public String image(@AuthenticationPrincipal Jwt jwt, @PathVariable int levelNumber, @RequestParam("file") MultipartFile file) throws IOException {
        requireAdmin(jwt);
        if (levelNumber < 1 || levelNumber > 20 || file == null || file.isEmpty() || file.getSize() > 2L * 1024 * 1024) throw new IllegalArgumentException("Choose a level badge image up to 2 MB.");
        if (!Set.of("image/png", "image/jpeg", "image/webp", "image/svg+xml").contains(String.valueOf(file.getContentType()).toLowerCase())) throw new IllegalArgumentException("Use a PNG, JPG, WebP, or SVG badge image.");
        String key = storage.uploadFile(file, "certification-review-levels");
        levels.setImage(levelNumber, key);
        return key;
    }
    private CurrentUserDto requireAdmin(Jwt jwt) { if (jwt == null) throw new IllegalArgumentException("Authentication is required"); CurrentUserDto user=auth.syncCurrentUser(jwt,jwt.getTokenValue()); if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required"); return user; }
}
