package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.MemberLearningStatsDto;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.entity.InstitutionCertificateArchive;
import com.capstone.rebyu.institution.entity.InstitutionLearnerRecord;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.institution.repository.InstitutionLearnerRecordRepository;
import com.capstone.rebyu.user.entity.Learner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Taking learners out of an institution, the one way it is done — whether a head
 * removes them or the certification's access expires:
 * <ol>
 *   <li>their record is frozen as an {@link InstitutionLearnerRecord} (department,
 *       section, dates and every figure, as they stood that moment);</li>
 *   <li>their department memberships are archived (section, department assessments
 *       and announcements end with them);</li>
 *   <li>their institution enrolment is revoked (institution access ends);</li>
 *   <li>their own enrolment in the certification is kept, so they keep studying.</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionMembershipService {

    private final com.capstone.rebyu.institution.service.SeatLedgerService seatLedger;

    private final InstitutionCertificationLearnerRepository enrollments;
    private final DepartmentLearnerRepository departmentLearners;
    private final DepartmentRepository departments;
    private final InstitutionCertificateRepository allocations;
    private final LearnerCertificationRepository ownEnrollments;
    private final InstitutionLearnerRecordRepository records;
    private final InstitutionLearningStatsService stats;
    private final AssessmentAttemptRepository attempts;

    /** One learner's record, live or frozen — the shape every export reads. */
    public record LearnerRecordDto(
            Long learnerId, String name, String username, String email,
            String certificationTitle, String departmentName, String sectionName, String programName,
            LocalDateTime joinedAt, LocalDateTime leftAt, String leftReason,
            BigDecimal progressPercentage, Long lessonsCompleted, Long gradedAttempts, Long passedAttempts,
            Integer passRate, Integer averageScore, Boolean badgeEarned, LocalDateTime badgeEarnedAt,
            Boolean mockExamPassed, BigDecimal bestMockExamScore, LocalDateTime lastActivityAt) {

        static LearnerRecordDto of(InstitutionLearnerRecord r) {
            return new LearnerRecordDto(r.getLearnerId(), r.getLearnerName(), r.getUsername(), r.getEmail(),
                    r.getCertificationTitle(), r.getDepartmentName(), r.getSectionName(), r.getProgramName(),
                    r.getJoinedAt(), r.getLeftAt(), r.getReason() == null ? null : r.getReason().name(),
                    r.getProgressPercentage(), r.getLessonsCompleted(), r.getGradedAttempts(), r.getPassedAttempts(),
                    r.getPassRate(), r.getAverageScore(), r.getBadgeEarned(), r.getBadgeEarnedAt(),
                    r.getMockExamPassed(), r.getBestMockExamScore(), r.getLastActivityAt());
        }
    }

    /**
     * Releases these enrolments. Seats: a removal gives its seat back; an expiry
     * leaves seat counts to the caller (the whole term ends).
     *
     * @return how many learners were released
     */
    @Transactional
    public int release(List<InstitutionCertificationLearner> list, InstitutionLearnerRecord.Reason reason,
                       InstitutionCertificateArchive archive, LocalDateTime when) {
        List<InstitutionCertificationLearner> active = list.stream()
                .filter(e -> e.getStatus() != InstitutionCertificationLearner.Status.revoked)
                .toList();
        if (active.isEmpty()) return 0;

        List<InstitutionLearnerRecord> snapshots = snapshot(active, when, reason, archive);
        records.saveAll(snapshots);

        Map<Long, List<DepartmentLearner>> membershipsByEnrollment = departmentLearners
                .findByInstitutionCertLearner_InstitutionCertLearnerIdIn(
                        active.stream().map(InstitutionCertificationLearner::getInstitutionCertLearnerId).toList())
                .stream()
                .collect(Collectors.groupingBy(row -> row.getInstitutionCertLearner().getInstitutionCertLearnerId()));

        for (InstitutionCertificationLearner enrollment : active) {
            for (DepartmentLearner membership : membershipsByEnrollment.getOrDefault(enrollment.getInstitutionCertLearnerId(), List.of())) {
                if (membership.getStatus() != DepartmentLearner.Status.active) continue;
                membership.setStatus(DepartmentLearner.Status.archived);
                membership.setRemovedAt(when);
                departmentLearners.save(membership);
                Department department = membership.getDepartment();
                if (department != null) {
                    department.setUsedSlots(Math.max(0, department.getUsedSlots() - 1));
                    seatLedger.recountAfterCommit();
                    departments.save(department);
                }
            }

            enrollment.setStatus(InstitutionCertificationLearner.Status.revoked);
            enrollments.save(enrollment);

            InstitutionCertificate seatRow = enrollment.getInstitutionCert();
            if (seatRow != null) {
                if (reason == InstitutionLearnerRecord.Reason.removed) {
                    int used = seatRow.getUsedSlots() == null ? 0 : seatRow.getUsedSlots();
                    seatRow.setUsedSlots(Math.max(0, used - 1));
                    seatLedger.recountAfterCommit();
                    allocations.save(seatRow);
                }
                keepOwnEnrollment(enrollment.getLearner(), seatRow);
            }
        }
        log.info("Released {} learner(s) from the institution ({})", active.size(), reason);
        return active.size();
    }

    /** The current (not yet released) learners of an allocation, in the same shape as a frozen record. */
    @Transactional(readOnly = true)
    public List<LearnerRecordDto> currentRecords(InstitutionCertificate allocation) {
        List<InstitutionCertificationLearner> current = enrollments
                .findByInstitutionCert_InstitutionCertId(allocation.getInstitutionCertId()).stream()
                .filter(e -> e.getStatus() != InstitutionCertificationLearner.Status.revoked)
                .toList();
        return snapshot(current, null, null, null).stream()
                .map(LearnerRecordDto::of)
                .sorted(Comparator.comparing(LearnerRecordDto::name, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LearnerRecordDto> formerRecords(Long institutionCertId) {
        return records.findByInstitutionCertIdAndArchiveIdIsNullOrderByLeftAtDesc(institutionCertId).stream()
                .map(LearnerRecordDto::of).toList();
    }

    @Transactional(readOnly = true)
    public List<LearnerRecordDto> archivedRecords(Long archiveId) {
        return records.findByArchiveIdOrderByLearnerNameAsc(archiveId).stream().map(LearnerRecordDto::of).toList();
    }

    /* Figures as they stand at `when` (now when null). */
    private List<InstitutionLearnerRecord> snapshot(List<InstitutionCertificationLearner> list, LocalDateTime when,
                                                    InstitutionLearnerRecord.Reason reason,
                                                    InstitutionCertificateArchive archive) {
        if (list.isEmpty()) return List.of();
        Map<Long, MemberLearningStatsDto> figures = stats.memberStats(list, when);

        Map<Long, DepartmentLearner> membershipByEnrollment = departmentLearners
                .findByInstitutionCertLearner_InstitutionCertLearnerIdIn(
                        list.stream().map(InstitutionCertificationLearner::getInstitutionCertLearnerId).toList())
                .stream()
                .collect(Collectors.toMap(
                        row -> row.getInstitutionCertLearner().getInstitutionCertLearnerId(),
                        Function.identity(),
                        // Prefer the active membership, else the latest one.
                        (a, b) -> a.getStatus() == DepartmentLearner.Status.active ? a
                                : b.getStatus() == DepartmentLearner.Status.active ? b
                                : (b.getAssignedAt() != null && a.getAssignedAt() != null && b.getAssignedAt().isAfter(a.getAssignedAt()) ? b : a)));

        // Mock exam results, one query per certification.
        Map<Long, AssessmentAttemptRepository.LearnerMockExamResult> mock = new java.util.HashMap<>();
        list.stream()
                .collect(Collectors.groupingBy(e -> certificationIdOf(e) == null ? -1L : certificationIdOf(e)))
                .forEach((certificationId, group) -> {
                    if (certificationId < 0) return;
                    List<Long> learnerIds = group.stream().map(e -> e.getLearner().getLearnerId()).toList();
                    attempts.passedMockExamsByLearnerIds(learnerIds, certificationId)
                            .forEach(row -> mock.putIfAbsent(row.getLearnerId(), row));
                });

        List<InstitutionLearnerRecord> out = new ArrayList<>();
        for (InstitutionCertificationLearner e : list) {
            Learner learner = e.getLearner();
            MemberLearningStatsDto m = figures.get(learner.getLearnerId());
            DepartmentLearner membership = membershipByEnrollment.get(e.getInstitutionCertLearnerId());
            InstitutionCertificate seatRow = e.getInstitutionCert();
            var mockRow = mock.get(learner.getLearnerId());
            boolean mockPassed = mockRow != null && (when == null || mockRow.getPassedAt() == null || !mockRow.getPassedAt().isAfter(when));
            out.add(InstitutionLearnerRecord.builder()
                    .institutionId(seatRow == null || seatRow.getInstitution() == null ? null : seatRow.getInstitution().getInstitutionId())
                    .institutionCertId(seatRow == null ? null : seatRow.getInstitutionCertId())
                    .certificationId(certificationIdOf(e))
                    .certificationTitle(seatRow == null || seatRow.getCertification() == null ? null : seatRow.getCertification().getTitle())
                    .archiveId(archive == null ? null : archive.getArchiveId())
                    .learnerId(learner.getLearnerId())
                    .learnerName(m == null ? learner.getUsername() : m.name())
                    .username(learner.getUsername())
                    .email(learner.getUser() == null ? null : learner.getUser().getEmail())
                    .departmentId(membership == null || membership.getDepartment() == null ? null : membership.getDepartment().getDepartmentId())
                    .departmentName(membership == null || membership.getDepartment() == null ? null : membership.getDepartment().getDepartmentName())
                    .sectionName(membership == null || membership.getSection() == null ? null : membership.getSection().getSectionName())
                    .programName(membership == null || membership.getSection() == null || membership.getSection().getProgram() == null
                            ? null : membership.getSection().getProgram().getProgramName())
                    .joinedAt(e.getAssignedAt())
                    .leftAt(when == null ? LocalDateTime.now() : when)
                    .reason(reason == null ? InstitutionLearnerRecord.Reason.removed : reason)
                    .progressPercentage(e.getProgressPercentage() == null ? null
                            : e.getProgressPercentage().setScale(1, RoundingMode.HALF_UP))
                    .lessonsCompleted(m == null ? 0L : m.lessonsCompleted())
                    .gradedAttempts(m == null ? 0L : m.gradedAttempts())
                    .passedAttempts(m == null ? 0L : m.passedAttempts())
                    .passRate(m == null ? null : m.passRate())
                    .averageScore(m == null ? null : m.averageScore())
                    .badgeEarned(e.getCompletedAt() != null)
                    .badgeEarnedAt(e.getCompletedAt())
                    .mockExamPassed(mockPassed)
                    .bestMockExamScore(mockRow == null || mockRow.getBestScore() == null ? null
                            : BigDecimal.valueOf(mockRow.getBestScore()).setScale(1, RoundingMode.HALF_UP))
                    .lastActivityAt(m == null ? null : m.lastActivityAt())
                    .build());
        }
        // A live listing is not "left"; the caller passes when==null only for those.
        if (when == null) out.forEach(r -> { r.setLeftAt(null); r.setReason(null); });
        return out;
    }

    private static Long certificationIdOf(InstitutionCertificationLearner e) {
        return e.getInstitutionCert() == null || e.getInstitutionCert().getCertification() == null
                ? null : e.getInstitutionCert().getCertification().getCertificationId();
    }

    private void keepOwnEnrollment(Learner learner, InstitutionCertificate seatRow) {
        if (learner == null || seatRow.getCertification() == null) return;
        Long certificationId = seatRow.getCertification().getCertificationId();
        ownEnrollments
                .findFirstByLearner_LearnerIdAndCertification_CertificationIdAndStatus(
                        learner.getLearnerId(), certificationId, LearnerCertification.Status.active)
                .orElseGet(() -> ownEnrollments.save(LearnerCertification.builder()
                        .learner(learner)
                        .certification(seatRow.getCertification())
                        .enrolledAt(LocalDateTime.now())
                        .status(LearnerCertification.Status.active)
                        .build()));
    }

    static boolean expired(InstitutionCertificate allocation, java.time.LocalDate today) {
        return allocation.getStatus() == InstitutionCertificate.Status.active
                && allocation.getAccessExpiryDate() != null
                && allocation.getAccessExpiryDate().isBefore(today)
                && !Objects.isNull(allocation.getInstitutionCertId());
    }
}
