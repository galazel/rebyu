package com.capstone.rebyu.department.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.entity.InstitutionSection;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.repository.InstitutionSectionRepository;
import com.capstone.rebyu.department.service.DepartmentService;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
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
import java.util.Map;
import java.util.Objects;

/**
 * Sections of a department: the department head's own subdivisions of the
 * learners in one institution group.
 *
 * Same access rule as announcements -- the institution owner or an active
 * department head of this group -- via {@link DepartmentService#getAccessibleById}.
 */
@RestController
@RequestMapping("/api/departments/{departmentId}/sections")
@RequiredArgsConstructor
public class InstitutionSectionController {

    private final InstitutionSectionRepository sections;
    private final DepartmentLearnerRepository assignees;
    private final DepartmentService departmentService;
    private final CognitoAuthService auth;
    private final EntityManager entityManager;

    public record SectionRequest(
            @NotBlank @Size(max = 150) String sectionName,
            @Size(max = 2000) String description) {
    }

    public record SectionDto(
            Long sectionId,
            Long departmentId,
            String sectionName,
            String description,
            LocalDateTime createdAt,
            long learnerCount,
            long pendingInvitationCount) {
    }

    /** Body of a move: the section to put the learner in, or null for "no section". */
    public record MoveRequest(Long sectionId) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SectionDto> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId) {
        requireDepartmentAccess(jwt, departmentId);
        return sections
                .findByDepartment_DepartmentIdAndStatusOrderByCreatedAtAsc(departmentId, InstitutionSection.Status.active)
                .stream().map(this::toDto).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SectionDto create(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @Valid @RequestBody SectionRequest request) {
        CurrentUserDto user = requireDepartmentAccess(jwt, departmentId);
        String name = request.sectionName().trim();
        if (sections.existsByDepartment_DepartmentIdAndSectionNameIgnoreCaseAndStatus(
                departmentId, name, InstitutionSection.Status.active)) {
            throw new IllegalArgumentException("A section named \"" + name + "\" already exists in this department.");
        }
        InstitutionSection saved = sections.save(InstitutionSection.builder()
                .department(entityManager.getReference(Department.class, departmentId))
                .sectionName(name)
                .description(blankToNull(request.description()))
                .createdBy(user.userId() == null ? null : entityManager.getReference(User.class, user.userId()))
                .createdAt(LocalDateTime.now())
                .status(InstitutionSection.Status.active)
                .build());
        return toDto(saved);
    }

    @PutMapping("/{sectionId}")
    @Transactional
    public SectionDto update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long sectionId,
            @Valid @RequestBody SectionRequest request) {
        requireDepartmentAccess(jwt, departmentId);
        InstitutionSection section = find(departmentId, sectionId);
        String name = request.sectionName().trim();
        if (!name.equalsIgnoreCase(section.getSectionName())
                && sections.existsByDepartment_DepartmentIdAndSectionNameIgnoreCaseAndStatus(
                        departmentId, name, InstitutionSection.Status.active)) {
            throw new IllegalArgumentException("A section named \"" + name + "\" already exists in this department.");
        }
        section.setSectionName(name);
        section.setDescription(blankToNull(request.description()));
        return toDto(sections.save(section));
    }

    /**
     * Deletes the section outright. Its learners stay in the department,
     * unsectioned; pending invitations sent for it still land the learner in
     * the department.
     *
     * The two updates are not optional bookkeeping -- department_learners and
     * learner_invitations are the only two tables holding a section_id, and
     * both must be detached before the row goes or the FK refuses the delete.
     */
    @DeleteMapping("/{sectionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId, @PathVariable Long sectionId) {
        requireDepartmentAccess(jwt, departmentId);
        InstitutionSection section = find(departmentId, sectionId);
        entityManager.createQuery(
                        "update DepartmentLearner a set a.section = null where a.section.sectionId = :id")
                .setParameter("id", sectionId).executeUpdate();
        entityManager.createQuery(
                        "update LearnerInvitation i set i.section = null where i.section.sectionId = :id")
                .setParameter("id", sectionId).executeUpdate();
        entityManager.flush();
        sections.delete(section);
    }

    /** Moves one learner (by assignee id) into a section, or out of all sections with a null id. */
    @PatchMapping("/assignees/{assigneeId}")
    @Transactional
    public Map<String, Object> move(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long assigneeId,
            @RequestBody MoveRequest request) {
        requireDepartmentAccess(jwt, departmentId);
        DepartmentLearner assignee = assignees.findById(assigneeId)
                .filter(a -> Objects.equals(a.getDepartment().getDepartmentId(), departmentId))
                .orElseThrow(() -> new EntityNotFoundException("That learner is not in this department."));
        InstitutionSection target = request.sectionId() == null ? null : find(departmentId, request.sectionId());
        assignee.setSection(target);
        assignees.save(assignee);
        Map<String, Object> out = new java.util.HashMap<>();
        out.put("departmentLearnerId", assigneeId);
        out.put("sectionId", target == null ? null : target.getSectionId());
        out.put("sectionName", target == null ? null : target.getSectionName());
        return out;
    }

    private InstitutionSection find(Long departmentId, Long sectionId) {
        return sections.findBySectionIdAndDepartment_DepartmentId(sectionId, departmentId)
                .filter(s -> s.getStatus() == InstitutionSection.Status.active)
                .orElseThrow(() -> new EntityNotFoundException("Section not found in this department."));
    }

    private SectionDto toDto(InstitutionSection s) {
        long learners = entityManager.createQuery(
                        "select count(a) from DepartmentLearner a where a.section.sectionId = :id and a.status = :st", Long.class)
                .setParameter("id", s.getSectionId())
                .setParameter("st", DepartmentLearner.Status.active)
                .getSingleResult();
        long pending = entityManager.createQuery(
                        "select count(i) from LearnerInvitation i where i.section.sectionId = :id and i.status = :st", Long.class)
                .setParameter("id", s.getSectionId())
                .setParameter("st", LearnerInvitation.Status.PENDING)
                .getSingleResult();
        return new SectionDto(s.getSectionId(), s.getDepartment().getDepartmentId(), s.getSectionName(),
                s.getDescription(), s.getCreatedAt(), learners, pending);
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

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
