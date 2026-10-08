package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.department.service.DepartmentService;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.progress.analytics.dto.ProgressAnalyticsDtos.ProgressAnalyticsResponse;
import com.capstone.rebyu.progress.analytics.service.ProgressAnalyticsService;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionLearnerInsightsService {

    public record DepartmentLearnerRow(
            Long departmentLearnerId,
            Long learnerId,
            Long institutionCertLearnerId,
            String name,
            String username,
            String avatarKey,
            String email,
            String status,
            LocalDateTime assignedAt,
            int completedLessonCount,
            int totalLessonCount,
            Double completionPercentage,
            boolean mockExamPassed,
            Double bestMockExamScore,
            LocalDateTime mockExamPassedAt,
            Long sectionId,
            String sectionName
    ) {}

    private final DepartmentRepository departmentRepository;
    private final DepartmentLearnerRepository departmentLearnerRepository;
    private final DepartmentService departmentService;
    private final ProgressAnalyticsService progressAnalyticsService;
    private final LessonRepository lessonRepository;
    private final LearnerCompletedLessonRepository learnerCompletedLessonRepository;
    private final AssessmentAttemptRepository assessmentAttemptRepository;

    @Transactional(readOnly = true)
    public List<DepartmentLearnerRow> groupRoster(
            Long departmentId, Long institutionId, Long callerUserId, boolean callerIsOwner) {
        Department group = requireDepartmentAccess(departmentId, institutionId, callerUserId, callerIsOwner);

        Long certificationId = certificationIdOf(group);
        int totalLessons = certificationId == null ? 0 : lessonRepository
                .findByMiddleCategory_MajorCategory_Certification_CertificationId(certificationId)
                .size();

        List<DepartmentLearner> active = departmentLearnerRepository
                .findByDepartment_DepartmentId(departmentId).stream()
                .filter(assignee -> assignee.getStatus() == DepartmentLearner.Status.active)
                .toList();

        List<Long> learnerIds = active.stream()
                .map(this::learnerOf)
                .filter(java.util.Objects::nonNull)
                .map(Learner::getLearnerId)
                .toList();
        Map<Long, AssessmentAttemptRepository.LearnerMockExamResult> mockPasses =
                (learnerIds.isEmpty() || certificationId == null)
                        ? Map.of()
                        : assessmentAttemptRepository
                                .passedMockExamsByLearnerIds(learnerIds, certificationId).stream()
                                .collect(Collectors.toMap(
                                        AssessmentAttemptRepository.LearnerMockExamResult::getLearnerId,
                                        Function.identity(),
                                        (first, second) -> first));

        return active.stream()
                .map(assignee -> toRow(assignee, certificationId, totalLessons, mockPasses))
                .sorted(Comparator.comparing(
                        DepartmentLearnerRow::name, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProgressAnalyticsResponse learnerAnalytics(
            Long departmentId, Long learnerId, Long institutionId, Long callerUserId, boolean callerIsOwner) {
        Department group = requireDepartmentAccess(departmentId, institutionId, callerUserId, callerIsOwner);
        requireAssignedToGroup(departmentId, learnerId);

        Long certificationId = certificationIdOf(group);
        if (certificationId == null) {
            throw new EntityNotFoundException(
                    "This group has no certification allocation: " + departmentId);
        }
        return progressAnalyticsService.getProgressAnalytics(learnerId, certificationId);
    }

    @Transactional
    public void removeFromGroup(
            Long departmentId, Long learnerId, Long institutionId, Long callerUserId, boolean callerIsOwner) {
        Department group = requireDepartmentAccess(departmentId, institutionId, callerUserId, callerIsOwner);

        DepartmentLearner assignee = activeAssignee(departmentId, learnerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Learner not assigned to this group: " + learnerId));

        assignee.setStatus(DepartmentLearner.Status.archived);
        assignee.setRemovedAt(LocalDateTime.now());
        departmentLearnerRepository.save(assignee);

        group.setUsedSlots(Math.max(0, group.getUsedSlots() - 1));
        departmentRepository.save(group);

        log.info("Learner {} removed from group {} by userId={}; 1 slot restored",
                learnerId, departmentId, callerUserId);
    }

    private Department requireDepartmentAccess(
            Long departmentId, Long institutionId, Long callerUserId, boolean callerIsOwner) {
        departmentService.getAccessibleById(departmentId, institutionId, callerUserId, callerIsOwner);
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Department not found: " + departmentId));
    }

    private void requireAssignedToGroup(Long departmentId, Long learnerId) {
        if (activeAssignee(departmentId, learnerId).isEmpty()) {
            throw new EntityNotFoundException("Learner not assigned to this group: " + learnerId);
        }
    }

    private java.util.Optional<DepartmentLearner> activeAssignee(Long departmentId, Long learnerId) {
        return departmentLearnerRepository
                .findByDepartment_DepartmentId(departmentId).stream()
                .filter(assignee -> assignee.getStatus() == DepartmentLearner.Status.active)
                .filter(assignee -> {
                    Learner learner = learnerOf(assignee);
                    return learner != null && learner.getLearnerId().equals(learnerId);
                })
                .findFirst();
    }

    private DepartmentLearnerRow toRow(
            DepartmentLearner assignee, Long certificationId, int totalLessons,
            Map<Long, AssessmentAttemptRepository.LearnerMockExamResult> mockPasses) {
        InstitutionCertificationLearner enrollment = assignee.getInstitutionCertLearner();
        Learner learner = learnerOf(assignee);

        int completedLessons = 0;
        if (learner != null && certificationId != null) {
            completedLessons = learnerCompletedLessonRepository
                    .findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
                            learner.getLearnerId(), certificationId)
                    .size();
        }
        Double completionPercentage = totalLessons > 0
                ? (completedLessons * 100.0) / totalLessons
                : null;

        AssessmentAttemptRepository.LearnerMockExamResult mockPass =
                learner == null ? null : mockPasses.get(learner.getLearnerId());

        return new DepartmentLearnerRow(
                assignee.getDepartmentLearnerId(),
                learner != null ? learner.getLearnerId() : null,
                enrollment != null ? enrollment.getInstitutionCertLearnerId() : null,
                displayName(learner),
                learner != null ? learner.getUsername() : null,
                learner != null ? learner.getAvatarKey() : null,
                learner != null && learner.getUser() != null ? learner.getUser().getEmail() : null,
                assignee.getStatus() != null ? assignee.getStatus().name() : null,
                assignee.getAssignedAt(),
                completedLessons,
                totalLessons,
                completionPercentage,
                mockPass != null,
                mockPass == null ? null : mockPass.getBestScore(),
                mockPass == null ? null : mockPass.getPassedAt(),
                assignee.getSection() != null ? assignee.getSection().getSectionId() : null,
                assignee.getSection() != null ? assignee.getSection().getSectionName() : null
        );
    }

    private String displayName(Learner learner) {
        if (learner == null) {
            return "Unknown learner";
        }
        String first = learner.getFirstName() == null ? "" : learner.getFirstName().trim();
        String last = learner.getLastName() == null ? "" : learner.getLastName().trim();
        String full = (first + " " + last).trim();
        if (!full.isEmpty()) {
            return full;
        }
        return learner.getUsername() != null && !learner.getUsername().isBlank()
                ? learner.getUsername()
                : "Unknown learner";
    }

    private Learner learnerOf(DepartmentLearner assignee) {
        return assignee.getInstitutionCertLearner() != null ? assignee.getInstitutionCertLearner().getLearner() : null;
    }

    private Long certificationIdOf(Department group) {
        if (group.getInstitutionCert() == null || group.getInstitutionCert().getCertification() == null) {
            return null;
        }
        return group.getInstitutionCert().getCertification().getCertificationId();
    }
}
