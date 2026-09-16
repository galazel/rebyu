package com.capstone.rebyu.institutiongroup.controller;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.institutiongroup.entity.GroupAnnouncement;
import com.capstone.rebyu.institutiongroup.entity.InstitutionGroup;
import com.capstone.rebyu.institutiongroup.entity.InstitutionGroupAssignee;
import com.capstone.rebyu.institutiongroup.repository.GroupAnnouncementRepository;
import com.capstone.rebyu.institutiongroup.repository.InstitutionGroupAssigneeRepository;
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
@RequestMapping("/api/learners/me/classes")
@RequiredArgsConstructor
public class LearnerClassController {

    private final CognitoAuthService auth;
    private final InstitutionGroupAssigneeRepository assignees;
    private final GroupAnnouncementRepository announcements;
    private final ExamRepository exams;

    public record ClassAnnouncement(Long groupAnnouncementId, String title, String body, boolean pinned,
                                    LocalDateTime createdAt) {
    }

    public record ClassAssessment(Long examId, String title, String examType, Integer durationMinutes,
                                  Integer totalQuestions) {
    }

    public record LearnerClass(Long groupId, String groupName, String groupDescription, String institutionName,
                               Long certificationId, List<ClassAnnouncement> announcements,
                               List<ClassAssessment> assessments) {
    }

    /** Every active class the learner is in, optionally narrowed to one certification. */
    @GetMapping
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
                .findByOrgCertLearner_Learner_LearnerIdAndStatus(user.learnerId(), InstitutionGroupAssignee.Status.active)
                .stream()
                .map(InstitutionGroupAssignee::getInstitutionGroup)
                .filter(group -> group != null && group.getStatus() == InstitutionGroup.Status.active)
                .filter(group -> certificationId == null || certificationId.equals(certificationIdOf(group)))
                .distinct()
                .map(this::toClass)
                .toList();
    }

    private LearnerClass toClass(InstitutionGroup group) {
        Long groupId = group.getInstitutionGroupId();
        List<ClassAnnouncement> posted = announcements
                .findByInstitutionGroup_InstitutionGroupIdAndStatusOrderByPinnedDescCreatedAtDesc(
                        groupId, GroupAnnouncement.Status.active)
                .stream()
                .map(a -> new ClassAnnouncement(a.getGroupAnnouncementId(), a.getTitle(), a.getBody(),
                        a.isPinned(), a.getCreatedAt()))
                .toList();
        List<ClassAssessment> published = exams.findByOwnerGroup_InstitutionGroupId(groupId).stream()
                .filter(exam -> exam.effectiveStatus() == Exam.Status.PUBLISHED)
                .map(exam -> new ClassAssessment(exam.getExamId(), exam.getTitle(),
                        exam.getExamType() == null ? null : exam.getExamType().getExamTypeText(),
                        exam.getDurationMinutes(), exam.getTotalQuestions()))
                .toList();
        return new LearnerClass(groupId, group.getGroupName(), group.getGroupDescription(),
                group.getInstitution() == null ? null : group.getInstitution().getInstitutionName(),
                certificationIdOf(group), posted, published);
    }

    private static Long certificationIdOf(InstitutionGroup group) {
        return group.getOrgCert() == null || group.getOrgCert().getCertification() == null
                ? null
                : group.getOrgCert().getCertification().getCertificationId();
    }
}
