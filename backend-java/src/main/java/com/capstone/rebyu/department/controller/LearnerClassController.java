package com.capstone.rebyu.department.controller;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.entity.DepartmentAnnouncement;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.repository.DepartmentAnnouncementRepository;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * The learner's side of an institution group ("class"): which group they were
 * invited into, what its leader has announced, and the assessments the leader
 * published for it. Until this existed a learner who accepted an invitation saw
 * nothing of the group at all -- only the official curriculum.
 */
@RestController
@RequestMapping("/api/learners/me")
@RequiredArgsConstructor
public class LearnerClassController {

    private final CognitoAuthService auth;
    private final DepartmentLearnerRepository assignees;
    private final DepartmentAnnouncementRepository announcements;
    private final ExamRepository exams;

    public record ClassAnnouncement(Long departmentAnnouncementId, String title, String body, boolean pinned,
                                    LocalDateTime createdAt) {
    }

    public record ClassAssessment(Long examId, String title, String examType, Integer durationMinutes,
                                  Integer totalQuestions) {
    }

    public record LearnerClass(Long departmentId, String departmentName, String departmentDescription, String institutionName,
                               Long certificationId, List<ClassAnnouncement> announcements,
                               List<ClassAssessment> assessments) {
    }

    /** Every active class the learner is in, optionally narrowed to one certification. */
    @GetMapping("/classes")
    @Transactional(readOnly = true)
    public List<LearnerClass> myClasses(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long certificationId) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.learnerId() == null) {
            return List.of();
        }
        return assignees
                .findByInstitutionCertLearner_Learner_LearnerIdAndStatus(user.learnerId(), DepartmentLearner.Status.active)
                .stream()
                .map(DepartmentLearner::getDepartment)
                .filter(group -> group != null && group.getStatus() == Department.Status.active)
                .filter(group -> certificationId == null || certificationId.equals(certificationIdOf(group)))
                .distinct()
                .map(this::toClass)
                .toList();
    }

    public record MyAnnouncement(Long departmentAnnouncementId, String title, String body, boolean pinned,
                                 LocalDateTime createdAt, String departmentName, String authorName) {
    }

    /** Announcements from every active class the learner is in, newest pinned first. */
    @GetMapping("/announcements")
    @Transactional(readOnly = true)
    public List<MyAnnouncement> myAnnouncements(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long certificationId) {
        return myClasses(jwt, certificationId).stream()
                .flatMap(c -> c.announcements().stream()
                        .map(a -> new MyAnnouncement(a.departmentAnnouncementId(), a.title(), a.body(),
                                a.pinned(), a.createdAt(), c.departmentName(), null)))
                .sorted(java.util.Comparator.comparing(MyAnnouncement::pinned).reversed()
                        .thenComparing(MyAnnouncement::createdAt,
                                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                .toList();
    }

    private LearnerClass toClass(Department group) {
        Long departmentId = group.getDepartmentId();
        List<ClassAnnouncement> posted = announcements
                .findByDepartment_DepartmentIdAndStatusOrderByPinnedDescCreatedAtDesc(
                        departmentId, DepartmentAnnouncement.Status.active)
                .stream()
                .map(a -> new ClassAnnouncement(a.getDepartmentAnnouncementId(), a.getTitle(), a.getBody(),
                        a.isPinned(), a.getCreatedAt()))
                .toList();
        List<ClassAssessment> published = exams.findByOwnerGroup_DepartmentId(departmentId).stream()
                .filter(exam -> exam.effectiveStatus() == Exam.Status.PUBLISHED)
                .map(exam -> new ClassAssessment(exam.getExamId(), exam.getTitle(),
                        exam.getExamType() == null ? null : exam.getExamType().getExamTypeText(),
                        exam.getDurationMinutes(), exam.getTotalQuestions()))
                .toList();
        return new LearnerClass(departmentId, group.getDepartmentName(), group.getDepartmentDescription(),
                group.getInstitution() == null ? null : group.getInstitution().getInstitutionName(),
                certificationIdOf(group), posted, published);
    }

    private static Long certificationIdOf(Department group) {
        return group.getInstitutionCert() == null || group.getInstitutionCert().getCertification() == null
                ? null
                : group.getInstitutionCert().getCertification().getCertificationId();
    }
}
