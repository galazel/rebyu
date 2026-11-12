package com.capstone.rebyu.department.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.entity.DepartmentAnnouncement;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.repository.DepartmentAnnouncementRepository;
import com.capstone.rebyu.department.service.DepartmentService;
import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/departments/{departmentId}/announcements")
@RequiredArgsConstructor
public class DepartmentAnnouncementController {

    private final DepartmentAnnouncementRepository announcements;
    private final DepartmentService departmentService;
    private final CognitoAuthService auth;
    private final EntityManager entityManager;

    public record AnnouncementRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 10000) String body,
            Boolean pinned,
            // Certification ids whose learners see it; empty or missing = the whole department.
            List<Long> certificationIds) {
    }

    public record AnnouncementDto(
            Long departmentAnnouncementId,
            Long departmentId,
            String title,
            String body,
            boolean pinned,
            List<Long> certificationIds,
            String createdByEmail,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<AnnouncementDto> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId) {
        requireDepartmentAccess(jwt, departmentId);
        return announcements
                .findByDepartment_DepartmentIdAndStatusOrderByPinnedDescCreatedAtDesc(
                        departmentId, DepartmentAnnouncement.Status.active)
                .stream().map(DepartmentAnnouncementController::toDto).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AnnouncementDto create(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @Valid @RequestBody AnnouncementRequest request) {
        CurrentUserDto user = requireDepartmentAccess(jwt, departmentId);
        Department department = entityManager.find(Department.class, departmentId);
        DepartmentAnnouncement saved = announcements.save(DepartmentAnnouncement.builder()
                .department(department)
                .certificationIds(audience(department, request.certificationIds()))
                .createdBy(user.userId() == null ? null : entityManager.getReference(User.class, user.userId()))
                .title(request.title().trim())
                .body(request.body().trim())
                .pinned(Boolean.TRUE.equals(request.pinned()))
                .createdAt(LocalDateTime.now())
                .build());
        return new AnnouncementDto(saved.getDepartmentAnnouncementId(), departmentId, saved.getTitle(), saved.getBody(),
                saved.isPinned(), List.copyOf(saved.getCertificationIds()), user.email(), saved.getCreatedAt(), null);
    }

    @PutMapping("/{announcementId}")
    @Transactional
    public AnnouncementDto update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long announcementId,
            @Valid @RequestBody AnnouncementRequest request) {
        requireDepartmentAccess(jwt, departmentId);
        DepartmentAnnouncement announcement = find(departmentId, announcementId);
        announcement.setTitle(request.title().trim());
        announcement.setBody(request.body().trim());
        announcement.setPinned(Boolean.TRUE.equals(request.pinned()));
        // Missing keeps the audience (a pin toggle); a list, even empty, replaces it.
        if (request.certificationIds() != null) {
            announcement.getCertificationIds().clear();
            announcement.getCertificationIds().addAll(audience(announcement.getDepartment(), request.certificationIds()));
        }
        announcement.setUpdatedAt(LocalDateTime.now());
        return toDto(announcements.save(announcement));
    }

    @DeleteMapping("/{announcementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void archive(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long announcementId) {
        requireDepartmentAccess(jwt, departmentId);
        DepartmentAnnouncement announcement = find(departmentId, announcementId);
        announcement.setStatus(DepartmentAnnouncement.Status.archived);
        announcement.setUpdatedAt(LocalDateTime.now());
        announcements.save(announcement);
    }

    /** The chosen certifications, each one the department must cover. */
    private static java.util.Set<Long> audience(Department department, List<Long> certificationIds) {
        java.util.Set<Long> chosen = new java.util.LinkedHashSet<>();
        if (certificationIds == null) return chosen;
        java.util.Set<Long> covered = new java.util.HashSet<>();
        department.getInstitutionCerts().forEach(cert -> {
            if (cert.getCertification() != null) covered.add(cert.getCertification().getCertificationId());
        });
        for (Long id : certificationIds) {
            if (id == null) continue;
            if (!covered.contains(id)) {
                throw new IllegalArgumentException("This department does not cover that certification.");
            }
            chosen.add(id);
        }
        return chosen;
    }

    private DepartmentAnnouncement find(Long departmentId, Long announcementId) {
        DepartmentAnnouncement announcement = announcements
                .findByDepartmentAnnouncementIdAndDepartment_DepartmentId(announcementId, departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found: " + announcementId));
        if (announcement.getStatus() != DepartmentAnnouncement.Status.active) {
            throw new EntityNotFoundException("Announcement not found: " + announcementId);
        }
        return announcement;
    }

    private CurrentUserDto requireDepartmentAccess(Jwt jwt, Long departmentId) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        boolean owner = "owner".equalsIgnoreCase(user.departmentHeadRole());
        departmentService.getAccessibleById(departmentId, user.institutionId(), user.userId(), owner);
        return user;
    }

    private static AnnouncementDto toDto(DepartmentAnnouncement a) {
        return new AnnouncementDto(
                a.getDepartmentAnnouncementId(),
                a.getDepartment().getDepartmentId(),
                a.getTitle(),
                a.getBody(),
                a.isPinned(),
                List.copyOf(a.getCertificationIds()),
                a.getCreatedBy() == null ? null : a.getCreatedBy().getEmail(),
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
