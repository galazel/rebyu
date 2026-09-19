package com.capstone.rebyu.institutiongroup.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.institutiongroup.entity.GroupAnnouncement;
import com.capstone.rebyu.institutiongroup.entity.InstitutionGroup;
import com.capstone.rebyu.institutiongroup.repository.GroupAnnouncementRepository;
import com.capstone.rebyu.institutiongroup.service.InstitutionGroupService;
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

/**
 * A group's announcements. The workspace page has called these endpoints all
 * along, but nothing served them: every read failed and was retried behind the
 * loading screen, and posting ended in "An unexpected error occurred".
 *
 * <p>Access is the group workspace's own rule: the institution owner, or an
 * active authority (leader) of this group, within the caller's institution.
 */
@RestController
@RequestMapping("/api/institution-groups/{groupId}/announcements")
@RequiredArgsConstructor
public class GroupAnnouncementController {

    private final GroupAnnouncementRepository announcements;
    private final InstitutionGroupService institutionGroupService;
    private final CognitoAuthService auth;
    private final EntityManager entityManager;

    public record AnnouncementRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 10000) String body,
            Boolean pinned) {
    }

    public record AnnouncementDto(
            Long groupAnnouncementId,
            Long institutionGroupId,
            String title,
            String body,
            boolean pinned,
            String createdByEmail,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<AnnouncementDto> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long groupId) {
        requireGroupAccess(jwt, groupId);
        return announcements
                .findByInstitutionGroup_InstitutionGroupIdAndStatusOrderByPinnedDescCreatedAtDesc(
                        groupId, GroupAnnouncement.Status.active)
                .stream().map(GroupAnnouncementController::toDto).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AnnouncementDto create(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long groupId,
            @Valid @RequestBody AnnouncementRequest request) {
        CurrentUserDto user = requireGroupAccess(jwt, groupId);
        GroupAnnouncement saved = announcements.save(GroupAnnouncement.builder()
                .institutionGroup(entityManager.getReference(InstitutionGroup.class, groupId))
                .createdBy(user.userId() == null ? null : entityManager.getReference(User.class, user.userId()))
                .title(request.title().trim())
                .body(request.body().trim())
                .pinned(Boolean.TRUE.equals(request.pinned()))
                .createdAt(LocalDateTime.now())
                .build());
        return new AnnouncementDto(saved.getGroupAnnouncementId(), groupId, saved.getTitle(), saved.getBody(),
                saved.isPinned(), user.email(), saved.getCreatedAt(), null);
    }

    @PutMapping("/{announcementId}")
    @Transactional
    public AnnouncementDto update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long groupId,
            @PathVariable Long announcementId,
            @Valid @RequestBody AnnouncementRequest request) {
        requireGroupAccess(jwt, groupId);
        GroupAnnouncement announcement = find(groupId, announcementId);
        announcement.setTitle(request.title().trim());
        announcement.setBody(request.body().trim());
        announcement.setPinned(Boolean.TRUE.equals(request.pinned()));
        announcement.setUpdatedAt(LocalDateTime.now());
        return toDto(announcements.save(announcement));
    }

    @DeleteMapping("/{announcementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void archive(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long groupId,
            @PathVariable Long announcementId) {
        requireGroupAccess(jwt, groupId);
        GroupAnnouncement announcement = find(groupId, announcementId);
        announcement.setStatus(GroupAnnouncement.Status.archived);
        announcement.setUpdatedAt(LocalDateTime.now());
        announcements.save(announcement);
    }

    private GroupAnnouncement find(Long groupId, Long announcementId) {
        GroupAnnouncement announcement = announcements
                .findByGroupAnnouncementIdAndInstitutionGroup_InstitutionGroupId(announcementId, groupId)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found: " + announcementId));
        if (announcement.getStatus() != GroupAnnouncement.Status.active) {
            throw new EntityNotFoundException("Announcement not found: " + announcementId);
        }
        return announcement;
    }

    /** Throws unless the caller is this group's institution owner or one of its leaders. */
    private CurrentUserDto requireGroupAccess(Jwt jwt, Long groupId) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        boolean owner = "owner".equalsIgnoreCase(user.institutionMemberRole());
        institutionGroupService.getAccessibleById(groupId, user.institutionId(), user.userId(), owner);
        return user;
    }

    private static AnnouncementDto toDto(GroupAnnouncement a) {
        return new AnnouncementDto(
                a.getGroupAnnouncementId(),
                a.getInstitutionGroup().getInstitutionGroupId(),
                a.getTitle(),
                a.getBody(),
                a.isPinned(),
                a.getCreatedBy() == null ? null : a.getCreatedBy().getEmail(),
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
