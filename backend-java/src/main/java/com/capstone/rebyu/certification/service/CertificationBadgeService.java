package com.capstone.rebyu.certification.service;

import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.common.BusinessRuleException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * The badge artwork of a certification: the emblem a learner earns, in the
 * manner of Credly or Cisco's digital badges.
 *
 * Kept apart from {@link CertificationService} because that class rebuilds
 * the entity from the edit form, and a badge is a file, not a form field. It
 * lives in S3 under its own prefix; the certification row keeps only the key.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CertificationBadgeService {

    static final String FOLDER = "certification-badges";
    static final long MAX_BYTES = 2L * 1024 * 1024;
    static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/webp", "image/svg+xml");

    private final CertificationRepository certificationRepository;
    private final S3StorageService s3StorageService;

    /** One badge, ready to send: its bytes and their content type. */
    public record Badge(byte[] bytes, String contentType) {}

    /** Uploads the image and points the certification at it, replacing any earlier badge. */
    @Transactional
    public String replace(Long certificationId, MultipartFile image) {
        Certification certification = find(certificationId);
        validate(image);

        String key;
        try {
            key = s3StorageService.uploadFile(image, FOLDER);
        } catch (IOException e) {
            throw new IllegalStateException("The badge image could not be uploaded", e);
        }

        String previous = certification.getBadgeImageKey();
        certification.setBadgeImageKey(key);
        certificationRepository.save(certification);
        deleteQuietly(previous);
        log.info("Badge set for certification {} ({})", certificationId, key);
        return key;
    }

    @Transactional
    public void remove(Long certificationId) {
        Certification certification = find(certificationId);
        String previous = certification.getBadgeImageKey();
        if (previous == null) return;
        certification.setBadgeImageKey(null);
        certificationRepository.save(certification);
        deleteQuietly(previous);
    }

    /** The badge bytes, or null when the certification has no badge. */
    @Transactional(readOnly = true)
    public Badge read(Long certificationId) {
        String key = find(certificationId).getBadgeImageKey();
        if (key == null) return null;
        return new Badge(s3StorageService.downloadFile(key), contentTypeOf(key));
    }

    private Certification find(Long id) {
        return certificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Certification not found: " + id));
    }

    private static void validate(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new BusinessRuleException.InvalidBadgeImageException("Choose a badge image to upload.");
        }
        if (image.getSize() > MAX_BYTES) {
            throw new BusinessRuleException.InvalidBadgeImageException("A badge image must be 2 MB or smaller.");
        }
        String type = image.getContentType() == null ? "" : image.getContentType().toLowerCase();
        if (!ALLOWED_TYPES.contains(type)) {
            throw new BusinessRuleException.InvalidBadgeImageException(
                    "A badge must be a PNG, JPG, WebP or SVG image.");
        }
    }

    private void deleteQuietly(String key) {
        if (key == null) return;
        try {
            s3StorageService.deleteFile(key);
        } catch (RuntimeException e) {
            // An orphaned object is a storage cost, not a broken certification.
            log.warn("Could not delete replaced badge {}: {}", key, e.getMessage());
        }
    }

    private static final Map<String, String> TYPES = Map.of(
            "png", "image/png", "jpg", "image/jpeg", "jpeg", "image/jpeg",
            "webp", "image/webp", "svg", "image/svg+xml");

    private static String contentTypeOf(String key) {
        int dot = key.lastIndexOf('.');
        String ext = dot < 0 ? "" : key.substring(dot + 1).toLowerCase();
        return TYPES.getOrDefault(ext, "application/octet-stream");
    }
}
