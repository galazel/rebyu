package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.service.AssessmentAttemptService;
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
    private final ExamRepository examRepository;
    private final AssessmentAttemptService assessmentAttemptService;

    /** One attempt at a department assessment, as the department head sees it in a list. */
    public record AttemptSummary(
            Long attemptId,
            Integer attemptNumber,
            String status,
            BigDecimal percentage,
            Boolean passed,
            Integer correctCount,
            Integer itemCount,
            LocalDateTime startedAt,
            LocalDateTime submittedAt
    ) {}

    /** One member of the department and every attempt they made at the assessment. */
    public record MemberResult(
            Long learnerId,
            String name,
            String email,
            String avatarKey,
            String sectionName,
            BigDecimal bestPercentage,
            boolean passed,
            List<AttemptSummary> attempts
    ) {}

    public record AssessmentResults(
            Long examId,
            String title,
            String examType,
            String status,
            BigDecimal passingScore,
            Integer totalQuestions,
            Integer durationMinutes,
            int memberCount,
            int attemptedCount,
            int passedCount,
            Double averageBestPercentage,
            List<MemberResult> members
    ) {}

    @Transactional(readOnly = true)
    public List<DepartmentLearnerRow> groupRoster(
            Long departmentId, Long institutionId, Long callerUserId, boolean callerIsOwner) {
        Department group = requireDepartmentAccess(departmentId, institutionId, callerUserId, callerIsOwner);

        Long certificationId = certificationIdOf(group);
        int totalLessons = certificationId == null ? 0 : (int) lessonRepository
                .countByMiddleCategory_MajorCategory_Certification_CertificationId(certificationId);

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

        // One grouped count for the whole roster, instead of one query per learner.
        Map<Long, Long> completedByLearner = (learnerIds.isEmpty() || certificationId == null)
                ? Map.of()
                : learnerCompletedLessonRepository
                        .lessonsCompletedInCertification(learnerIds, certificationId).stream()
                        .collect(Collectors.toMap(
                                LearnerCompletedLessonRepository.LessonsDone::getLearnerId,
                                LearnerCompletedLessonRepository.LessonsDone::getLessonsCompleted));

        return active.stream()
                .map(assignee -> toRow(assignee, totalLessons, completedByLearner, mockPasses))
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

    /**
     * Every member's attempts and best score at one of the department's own assessments.
     * Members who have not taken it yet are listed too, so the head sees who is missing.
     */
    @Transactional(readOnly = true)
    public AssessmentResults assessmentResults(
            Long departmentId, Long examId, Long institutionId, Long callerUserId, boolean callerIsOwner) {
        requireDepartmentAccess(departmentId, institutionId, callerUserId, callerIsOwner);
        Exam exam = requireDepartmentExam(departmentId, examId);

        List<DepartmentLearner> members = departmentLearnerRepository
                .findWithLinksByDepartmentId(departmentId).stream()
                .filter(assignee -> assignee.getStatus() == DepartmentLearner.Status.active)
                .filter(assignee -> learnerOf(assignee) != null)
                .toList();
        List<Long> learnerIds = members.stream().map(m -> learnerOf(m).getLearnerId()).toList();

        Map<Long, List<AssessmentAttempt>> attemptsByLearner = learnerIds.isEmpty() ? Map.of()
                : assessmentAttemptRepository
                        .findByExam_ExamIdAndLearnerIdInOrderByAttemptNumberAsc(examId, learnerIds).stream()
                        .filter(a -> a.getStatus() != AssessmentAttempt.Status.CANCELLED)
                        .collect(Collectors.groupingBy(AssessmentAttempt::getLearnerId));

        List<MemberResult> rows = members.stream().map(member -> {
            Learner learner = learnerOf(member);
            List<AssessmentAttempt> attempts =
                    attemptsByLearner.getOrDefault(learner.getLearnerId(), List.of());
            BigDecimal best = attempts.stream()
                    .filter(a -> a.getStatus() == AssessmentAttempt.Status.SUBMITTED)
                    .map(AssessmentAttempt::getPercentage)
                    .filter(java.util.Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            boolean passed = attempts.stream().anyMatch(a -> Boolean.TRUE.equals(a.getPassed()));
            return new MemberResult(
                    learner.getLearnerId(),
                    displayName(learner),
                    learner.getUser() != null ? learner.getUser().getEmail() : null,
                    learner.getAvatarKey(),
                    member.getSection() != null ? member.getSection().getSectionName() : null,
                    best,
                    passed,
                    attempts.stream().map(a -> new AttemptSummary(
                            a.getAssessmentAttemptId(), a.getAttemptNumber(),
                            a.getStatus() != null ? a.getStatus().name() : null,
                            a.getPercentage(), a.getPassed(), a.getCorrectCount(), a.getItemCount(),
                            a.getStartedAt(), a.getSubmittedAt())).toList());
        }).sorted(Comparator.comparing(MemberResult::name,
                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))).toList();

        List<BigDecimal> bests = rows.stream().map(MemberResult::bestPercentage)
                .filter(java.util.Objects::nonNull).toList();
        Double averageBest = bests.isEmpty() ? null
                : bests.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);

        return new AssessmentResults(
                exam.getExamId(),
                exam.getTitle(),
                exam.getExamType() != null ? exam.getExamType().getExamTypeText() : null,
                exam.effectiveStatus() != null ? exam.effectiveStatus().name() : null,
                exam.getPassingScore(),
                exam.getTotalQuestions(),
                exam.getDurationMinutes(),
                rows.size(),
                bests.size(),
                (int) rows.stream().filter(MemberResult::passed).count(),
                averageBest,
                rows);
    }

    /**
     * A member's attempt question by question, with the correct answers shown. Only the
     * department's own assessments and its certification's, and only for its members.
     */
    @Transactional(readOnly = true)
    public com.capstone.rebyu.assessment.dto.attempt.LearnerAttemptDtos.AssessmentAttemptResultDto memberAttemptResult(
            Long departmentId, Long learnerId, Long attemptId,
            Long institutionId, Long callerUserId, boolean callerIsOwner) {
        Department group = requireDepartmentAccess(departmentId, institutionId, callerUserId, callerIsOwner);
        requireAssignedToGroup(departmentId, learnerId);

        AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
                .filter(a -> learnerId.equals(a.getLearnerId()))
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        Exam exam = attempt.getExam();
        boolean ownPaper = exam.getOwnerDepartment() != null
                && departmentId.equals(exam.getOwnerDepartment().getDepartmentId());
        boolean groupCertification = exam.getOwnerDepartment() == null
                && exam.getLearner() == null
                && exam.getCertification() != null
                && exam.getCertification().getCertificationId().equals(certificationIdOf(group));
        if (!ownPaper && !groupCertification) {
            throw new EntityNotFoundException("Attempt not found: " + attemptId);
        }
        return assessmentAttemptService.getResult(attemptId, learnerId, true);
    }

    private Exam requireDepartmentExam(Long departmentId, Long examId) {
        return examRepository.findById(examId)
                .filter(exam -> exam.getOwnerDepartment() != null
                        && departmentId.equals(exam.getOwnerDepartment().getDepartmentId()))
                .orElseThrow(() -> new EntityNotFoundException("Assessment not found: " + examId));
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
        if (!departmentLearnerRepository
                .existsByDepartment_DepartmentIdAndInstitutionCertLearner_Learner_LearnerIdAndStatus(
                        departmentId, learnerId, DepartmentLearner.Status.active)) {
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
            DepartmentLearner assignee, int totalLessons, Map<Long, Long> completedByLearner,
            Map<Long, AssessmentAttemptRepository.LearnerMockExamResult> mockPasses) {
        InstitutionCertificationLearner enrollment = assignee.getInstitutionCertLearner();
        Learner learner = learnerOf(assignee);

        int completedLessons = learner == null ? 0
                : completedByLearner.getOrDefault(learner.getLearnerId(), 0L).intValue();
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
