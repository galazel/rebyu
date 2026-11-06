package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentAnnouncement;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.entity.DepartmentProgram;
import com.capstone.rebyu.department.entity.InstitutionSection;
import com.capstone.rebyu.department.repository.DepartmentAnnouncementRepository;
import com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository;
import com.capstone.rebyu.department.repository.DepartmentProgramRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.department.repository.InstitutionSectionRepository;
import com.capstone.rebyu.department.service.DepartmentService;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.InstitutionLearningStatsDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.LearningStatsSummaryDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.MemberLearningStatsDto;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.service.InstitutionLearnerInsightsService.DepartmentLearnerRow;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Everything the department head's dashboard shows, for one department, in one
 * response. Each learner's status (and the reason for it) is decided here once,
 * so the dashboard, its alerts and the roster can never disagree.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentOverviewService {

    /** No graded attempt and no lesson finished in this many days = dormant. */
    static final int DORMANT_DAYS = 14;
    /** An average or pass rate under this is a learner at risk. */
    static final int AT_RISK_BELOW = 50;
    /** Access ending within this many days is raised as an alert. */
    static final int EXPIRY_WARNING_DAYS = 30;
    static final int RECENT_ANNOUNCEMENTS = 3;

    public enum LearnerStatus { completed, at_risk, dormant, not_started, on_track }

    public record CertificationSeats(
            Long institutionCertId,
            Long certificationId,
            String title,
            int totalSlots,
            int usedSlots,
            String status,
            LocalDate accessStartDate,
            LocalDate accessExpiryDate,
            Long daysRemaining) {}

    public record Totals(
            int learners,
            int activeLearners,
            int completed,
            int atRisk,
            int dormant,
            int notStarted,
            int onTrack,
            int unsectioned,
            int mockExamPassed,
            int sections,
            int programs,
            int departmentHeads,
            long pendingInvitations,
            int seatsTotal,
            int seatsUsed) {}

    public record LearnerRow(
            Long learnerId,
            String name,
            String username,
            String avatarKey,
            Long sectionId,
            String sectionName,
            String programName,
            String certificationTitle,
            BigDecimal averageProgress,
            Integer averageScore,
            Integer passRate,
            long gradedAttempts,
            long lessonsCompleted,
            LocalDateTime lastActivityAt,
            Long daysInactive,
            boolean mockExamPassed,
            LearnerStatus status,
            String reason,
            LocalDateTime joinedAt,
            LocalDateTime mockExamPassedAt) {}

    /** A learner who has left the department, with their figures as they stood when they left. */
    public record FormerLearnerRow(
            Long learnerId,
            String name,
            String username,
            String sectionName,
            String programName,
            String certificationTitle,
            LocalDateTime joinedAt,
            LocalDateTime removedAt,
            BigDecimal averageProgress,
            Integer averageScore,
            Integer passRate,
            long gradedAttempts,
            long lessonsCompleted,
            LocalDateTime lastActivityAt) {}

    public record SectionRow(
            Long sectionId,
            String sectionName,
            Long programId,
            String programName,
            String certificationTitle,
            int learners,
            BigDecimal averageProgress,
            Integer averageScore,
            int atRisk,
            int dormant,
            int notStarted,
            long pendingInvitations,
            LocalDateTime createdAt) {}

    public record Alert(
            String id,
            String severity,
            String category,
            String title,
            String message,
            int count,
            /** Where the head acts on it: roster, sections, announcements or none. */
            String action,
            /** The roster filter the action opens, when the action is roster. */
            String filter) {}

    public record AnnouncementBrief(
            Long departmentAnnouncementId,
            String title,
            String body,
            boolean pinned,
            String createdByEmail,
            LocalDateTime createdAt) {}

    public record DepartmentOverview(
            Long departmentId,
            String departmentName,
            String departmentDescription,
            List<CertificationSeats> certifications,
            Totals totals,
            LearningStatsSummaryDto summary,
            Map<String, Long> readinessDistribution,
            List<LearnerRow> learners,
            List<FormerLearnerRow> formerLearners,
            List<SectionRow> sections,
            List<Alert> alerts,
            List<AnnouncementBrief> announcements,
            long announcementCount,
            LocalDateTime generatedAt) {}

    private final DepartmentService departmentService;
    private final DepartmentRepository departmentRepository;
    private final InstitutionLearningStatsService learningStatsService;
    private final InstitutionLearnerInsightsService insightsService;
    private final InstitutionSectionRepository sectionRepository;
    private final DepartmentProgramRepository programRepository;
    private final DepartmentHeadAssignmentRepository headAssignmentRepository;
    private final DepartmentAnnouncementRepository announcementRepository;
    private final com.capstone.rebyu.department.repository.DepartmentLearnerRepository departmentLearnerRepository;
    private final EntityManager entityManager;

    public DepartmentOverview overview(Long departmentId, Long institutionId, Long userId, boolean owner) {
        // Throws 404 for a department the caller may not see.
        departmentService.getAccessibleById(departmentId, institutionId, userId, owner);
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Department not found: " + departmentId));

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        List<CertificationSeats> certifications = department.getInstitutionCerts().stream()
                .filter(cert -> cert.getCertification() != null)
                .map(cert -> seats(cert, today))
                .sorted(Comparator.comparing(CertificationSeats::title, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
        int seatsTotal = certifications.stream().mapToInt(CertificationSeats::totalSlots).sum();
        int seatsUsed = certifications.stream().mapToInt(CertificationSeats::usedSlots).sum();

        InstitutionLearningStatsDto stats =
                learningStatsService.learningStats(institutionId, List.of(departmentId), null, null);
        List<DepartmentLearnerRow> roster = insightsService.groupRoster(departmentId, institutionId, userId, owner);

        List<InstitutionSection> sections = sectionRepository
                .findByDepartment_DepartmentIdAndStatusOrderByCreatedAtAsc(departmentId, InstitutionSection.Status.active);
        Map<Long, InstitutionSection> sectionById = sections.stream()
                .collect(Collectors.toMap(InstitutionSection::getSectionId, Function.identity()));
        Map<Long, Long> pendingBySection = pendingInvitationsBySection(sections);

        List<DepartmentProgram> programs = programRepository
                .findByDepartment_DepartmentIdAndStatusOrderByProgramNameAsc(departmentId, DepartmentProgram.Status.active);
        int heads = (int) headAssignmentRepository.findByDepartment_DepartmentId(departmentId).stream()
                .filter(a -> a.getStatus() == DepartmentHeadAssignment.Status.active)
                .count();

        Map<Long, MemberLearningStatsDto> statsByLearner = stats.members().stream()
                .collect(Collectors.toMap(MemberLearningStatsDto::learnerId, Function.identity(), (a, b) -> a));

        // The roster is the department's membership; stats add the work done.
        Map<Long, DepartmentLearnerRow> rosterByLearner = new java.util.LinkedHashMap<>();
        for (DepartmentLearnerRow row : roster) {
            if (row.learnerId() != null) rosterByLearner.putIfAbsent(row.learnerId(), row);
        }

        List<LearnerRow> learners = new ArrayList<>();
        for (DepartmentLearnerRow row : rosterByLearner.values()) {
            MemberLearningStatsDto member = statsByLearner.get(row.learnerId());
            InstitutionSection section = row.sectionId() == null ? null : sectionById.get(row.sectionId());
            learners.add(learnerRow(row, member, section, now));
        }
        learners.sort(Comparator
                .comparingInt((LearnerRow l) -> statusRank(l.status()))
                .thenComparing(l -> l.averageProgress() == null ? BigDecimal.ZERO : l.averageProgress())
                .thenComparing(LearnerRow::name, Comparator.nullsLast(String::compareToIgnoreCase)));

        List<SectionRow> sectionRows = sections.stream()
                .map(section -> sectionRow(section, learners, pendingBySection.getOrDefault(section.getSectionId(), 0L)))
                .toList();

        Map<LearnerStatus, Long> byStatus = learners.stream()
                .collect(Collectors.groupingBy(LearnerRow::status, Collectors.counting()));
        int unsectioned = (int) learners.stream().filter(l -> l.sectionId() == null).count();
        int mockPassed = (int) learners.stream().filter(LearnerRow::mockExamPassed).count();
        int active = (int) learners.stream()
                .filter(l -> l.gradedAttempts() > 0 || l.lessonsCompleted() > 0).count();
        long pendingInvitations = pendingBySection.values().stream().mapToLong(Long::longValue).sum();

        Totals totals = new Totals(
                learners.size(),
                active,
                count(byStatus, LearnerStatus.completed),
                count(byStatus, LearnerStatus.at_risk),
                count(byStatus, LearnerStatus.dormant),
                count(byStatus, LearnerStatus.not_started),
                count(byStatus, LearnerStatus.on_track),
                unsectioned,
                mockPassed,
                sections.size(),
                programs.size(),
                heads,
                pendingInvitations,
                seatsTotal,
                seatsUsed);

        List<DepartmentAnnouncement> activeAnnouncements = announcementRepository
                .findByDepartment_DepartmentIdAndStatusOrderByPinnedDescCreatedAtDesc(
                        departmentId, DepartmentAnnouncement.Status.active);
        List<AnnouncementBrief> recent = activeAnnouncements.stream()
                .limit(RECENT_ANNOUNCEMENTS)
                .map(a -> new AnnouncementBrief(
                        a.getDepartmentAnnouncementId(),
                        a.getTitle(),
                        a.getBody(),
                        a.isPinned(),
                        a.getCreatedBy() == null ? null : a.getCreatedBy().getEmail(),
                        a.getCreatedAt()))
                .toList();

        LearningStatsSummaryDto s = stats.summary();
        LearningStatsSummaryDto summary = new LearningStatsSummaryDto(
                learners.size(), active, learners.size() - active,
                s.averageProgress(), s.lessonsCompleted(), s.gradedAttempts(),
                s.passRate(), s.averageScore(), seatsTotal, seatsUsed);

        return new DepartmentOverview(
                department.getDepartmentId(),
                department.getDepartmentName(),
                department.getDepartmentDescription(),
                certifications,
                totals,
                summary,
                stats.readinessDistribution(),
                learners,
                formerLearners(departmentId, rosterByLearner.keySet()),
                sectionRows,
                alerts(certifications, totals),
                recent,
                activeAnnouncements.size(),
                now);
    }

    /* ---------------------------------------------------------------- */

    public static LearnerStatus statusOf(MemberLearningStatsDto m, LocalDateTime now) {
        if (m == null) return LearnerStatus.not_started;
        if (m.assignedCertifications() > 0 && m.completedCertifications() >= m.assignedCertifications()) {
            return LearnerStatus.completed;
        }
        if (m.gradedAttempts() == 0 && m.lessonsCompleted() == 0) return LearnerStatus.not_started;
        if (m.gradedAttempts() > 0 && ((m.averageScore() != null && m.averageScore() < AT_RISK_BELOW)
                || (m.passRate() != null && m.passRate() < AT_RISK_BELOW))) {
            return LearnerStatus.at_risk;
        }
        Long idle = daysSince(m.lastActivityAt(), now);
        if (idle != null && idle >= DORMANT_DAYS) return LearnerStatus.dormant;
        return LearnerStatus.on_track;
    }

    static String reasonFor(LearnerStatus status, MemberLearningStatsDto m, LocalDateTime now) {
        return switch (status) {
            case completed -> "Earned the review badge for every assigned certification";
            case not_started -> "No lesson finished and no graded attempt yet";
            case dormant -> "No activity in " + daysSince(m.lastActivityAt(), now) + " days";
            case at_risk -> m.averageScore() != null && m.averageScore() < AT_RISK_BELOW
                    ? "Averaging " + m.averageScore() + "% over " + m.gradedAttempts()
                            + (m.gradedAttempts() == 1 ? " attempt" : " attempts")
                    : "Passed " + m.passedAttempts() + " of " + m.gradedAttempts() + " attempts";
            case on_track -> null;
        };
    }

    private static int statusRank(LearnerStatus status) {
        return switch (status) {
            case at_risk -> 0;
            case dormant -> 1;
            case not_started -> 2;
            case on_track -> 3;
            case completed -> 4;
        };
    }

    private static Long daysSince(LocalDateTime at, LocalDateTime now) {
        return at == null ? null : Math.max(0, ChronoUnit.DAYS.between(at.toLocalDate(), now.toLocalDate()));
    }

    private static int count(Map<LearnerStatus, Long> byStatus, LearnerStatus status) {
        return byStatus.getOrDefault(status, 0L).intValue();
    }

    private static CertificationSeats seats(InstitutionCertificate cert, LocalDate today) {
        LocalDate expiry = cert.getAccessExpiryDate();
        return new CertificationSeats(
                cert.getInstitutionCertId(),
                cert.getCertification().getCertificationId(),
                cert.getCertification().getTitle(),
                cert.getTotalSlots() == null ? 0 : cert.getTotalSlots(),
                cert.getUsedSlots() == null ? 0 : cert.getUsedSlots(),
                cert.getStatus() == null ? null : cert.getStatus().name(),
                cert.getAccessStartDate(),
                expiry,
                expiry == null ? null : ChronoUnit.DAYS.between(today, expiry));
    }

    private LearnerRow learnerRow(DepartmentLearnerRow row, MemberLearningStatsDto m,
                                  InstitutionSection section, LocalDateTime now) {
        LearnerStatus status = statusOf(m, now);
        return new LearnerRow(
                row.learnerId(),
                m != null && m.name() != null ? m.name() : row.name(),
                row.username(),
                row.avatarKey(),
                row.sectionId(),
                row.sectionName(),
                section == null || section.getProgram() == null ? null : section.getProgram().getProgramName(),
                row.certificationTitle(),
                m == null ? null : m.averageProgress(),
                m == null ? null : m.averageScore(),
                m == null ? null : m.passRate(),
                m == null ? 0 : m.gradedAttempts(),
                m == null ? 0 : m.lessonsCompleted(),
                m == null ? null : m.lastActivityAt(),
                m == null ? null : daysSince(m.lastActivityAt(), now),
                row.mockExamPassed(),
                status,
                reasonFor(status, m, now),
                row.assignedAt(),
                row.mockExamPassedAt());
    }

    private static SectionRow sectionRow(InstitutionSection section, List<LearnerRow> learners, long pending) {
        List<LearnerRow> members = learners.stream()
                .filter(l -> Objects.equals(l.sectionId(), section.getSectionId()))
                .toList();
        BigDecimal progress = members.isEmpty() ? null : BigDecimal.valueOf(members.stream()
                        .mapToDouble(l -> l.averageProgress() == null ? 0 : l.averageProgress().doubleValue())
                        .average().orElse(0))
                .setScale(1, java.math.RoundingMode.HALF_UP);
        long scoredWeight = members.stream().filter(l -> l.averageScore() != null).mapToLong(LearnerRow::gradedAttempts).sum();
        Integer score = scoredWeight == 0 ? null : (int) Math.round(members.stream()
                .filter(l -> l.averageScore() != null)
                .mapToDouble(l -> l.averageScore() * (double) l.gradedAttempts())
                .sum() / scoredWeight);
        var cert = section.getInstitutionCert();
        return new SectionRow(
                section.getSectionId(),
                section.getSectionName(),
                section.getProgram() == null ? null : section.getProgram().getProgramId(),
                section.getProgram() == null ? null : section.getProgram().getProgramName(),
                cert == null || cert.getCertification() == null ? null : cert.getCertification().getTitle(),
                members.size(),
                progress,
                score,
                (int) members.stream().filter(l -> l.status() == LearnerStatus.at_risk).count(),
                (int) members.stream().filter(l -> l.status() == LearnerStatus.dormant).count(),
                (int) members.stream().filter(l -> l.status() == LearnerStatus.not_started).count(),
                pending,
                section.getCreatedAt());
    }

    /** Learners who left the department (and are not back), latest departure first. */
    private List<FormerLearnerRow> formerLearners(Long departmentId, java.util.Set<Long> currentLearnerIds) {
        Map<Long, DepartmentLearner> lastExit = new java.util.LinkedHashMap<>();
        for (DepartmentLearner row : departmentLearnerRepository.findWithLinksByDepartmentId(departmentId)) {
            if (row.getStatus() != DepartmentLearner.Status.archived || row.getInstitutionCertLearner() == null) continue;
            var learner = row.getInstitutionCertLearner().getLearner();
            if (learner == null || currentLearnerIds.contains(learner.getLearnerId())) continue;
            lastExit.merge(learner.getLearnerId(), row, (a, b) ->
                    (b.getRemovedAt() != null && (a.getRemovedAt() == null || b.getRemovedAt().isAfter(a.getRemovedAt()))) ? b : a);
        }
        List<FormerLearnerRow> out = new ArrayList<>();
        for (DepartmentLearner row : lastExit.values()) {
            var enrollment = row.getInstitutionCertLearner();
            var learner = enrollment.getLearner();
            MemberLearningStatsDto m = learningStatsService
                    .memberStats(List.of(enrollment), row.getRemovedAt())
                    .get(learner.getLearnerId());
            var cert = enrollment.getInstitutionCert() == null ? null : enrollment.getInstitutionCert().getCertification();
            var section = row.getSection();
            out.add(new FormerLearnerRow(
                    learner.getLearnerId(),
                    m == null ? learner.getUsername() : m.name(),
                    learner.getUsername(),
                    section == null ? null : section.getSectionName(),
                    section == null || section.getProgram() == null ? null : section.getProgram().getProgramName(),
                    cert == null ? null : cert.getTitle(),
                    row.getAssignedAt(),
                    row.getRemovedAt(),
                    m == null ? null : m.averageProgress(),
                    m == null ? null : m.averageScore(),
                    m == null ? null : m.passRate(),
                    m == null ? 0 : m.gradedAttempts(),
                    m == null ? 0 : m.lessonsCompleted(),
                    m == null ? null : m.lastActivityAt()));
        }
        out.sort(Comparator.comparing(FormerLearnerRow::removedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return out;
    }

    private Map<Long, Long> pendingInvitationsBySection(List<InstitutionSection> sections) {
        Map<Long, Long> counts = new HashMap<>();
        if (sections.isEmpty()) return counts;
        List<Long> ids = sections.stream().map(InstitutionSection::getSectionId).toList();
        for (Object[] row : entityManager.createQuery(
                        "select i.section.sectionId, count(i) from LearnerInvitation i "
                                + "where i.section.sectionId in :ids and i.status = :st group by i.section.sectionId",
                        Object[].class)
                .setParameter("ids", ids)
                .setParameter("st", LearnerInvitation.Status.PENDING)
                .getResultList()) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    static List<Alert> alerts(List<CertificationSeats> certifications, Totals totals) {
        List<Alert> alerts = new ArrayList<>();

        for (CertificationSeats cert : certifications) {
            if (cert.daysRemaining() == null) continue;
            long days = cert.daysRemaining();
            if (days < 0) {
                alerts.add(new Alert("access-expired-" + cert.institutionCertId(), "critical", "access",
                        cert.title() + " access has ended",
                        "Access ended on " + cert.accessExpiryDate() + ". Learners can no longer study or sit its "
                                + "assessments. Ask your institution administrator to renew it.",
                        0, "none", null));
            } else if (days <= EXPIRY_WARNING_DAYS) {
                alerts.add(new Alert("access-expiring-" + cert.institutionCertId(), days <= 7 ? "critical" : "warning",
                        "access",
                        cert.title() + (days == 0 ? " access ends today" : " access ends in " + days
                                + (days == 1 ? " day" : " days")),
                        "Access ends on " + cert.accessExpiryDate() + ". Ask your institution administrator to "
                                + "renew it, or export results before then.",
                        0, "none", null));
            }
        }

        for (CertificationSeats cert : certifications) {
            if (cert.totalSlots() <= 0) continue;
            int left = Math.max(0, cert.totalSlots() - cert.usedSlots());
            if (left == 0) {
                alerts.add(new Alert("seats-full-" + cert.institutionCertId(), "warning", "seats",
                        "No seats left on " + cert.title(),
                        "All " + cert.totalSlots() + " seats are taken. New learners cannot join until a seat is "
                                + "freed or the administrator adds seats.",
                        0, "roster", null));
            } else if (left * 10 <= cert.totalSlots()) {
                alerts.add(new Alert("seats-low-" + cert.institutionCertId(), "info", "seats",
                        left + (left == 1 ? " seat" : " seats") + " left on " + cert.title(),
                        cert.usedSlots() + " of " + cert.totalSlots() + " seats are taken.",
                        left, "roster", null));
            }
        }

        if (totals.atRisk() > 0) {
            alerts.add(new Alert("learners-at-risk", "warning", "academic",
                    plural(totals.atRisk(), "learner is", "learners are") + " at risk",
                    "Their average score or pass rate on graded attempts is under " + AT_RISK_BELOW + "%.",
                    totals.atRisk(), "roster", "at_risk"));
        }
        if (totals.dormant() > 0) {
            alerts.add(new Alert("learners-dormant", "info", "engagement",
                    plural(totals.dormant(), "learner has", "learners have") + " gone quiet",
                    "No lesson finished and no graded attempt in the last " + DORMANT_DAYS + " days.",
                    totals.dormant(), "roster", "dormant"));
        }
        if (totals.notStarted() > 0) {
            alerts.add(new Alert("learners-not-started", "info", "engagement",
                    plural(totals.notStarted(), "learner has", "learners have") + " not started",
                    "They have not finished a lesson or sat a graded attempt yet.",
                    totals.notStarted(), "roster", "not_started"));
        }
        if (totals.unsectioned() > 0 && totals.sections() > 0) {
            alerts.add(new Alert("learners-unsectioned", "info", "sections",
                    plural(totals.unsectioned(), "learner is", "learners are") + " not in a section",
                    "Put them in a section so their class results are counted.",
                    totals.unsectioned(), "roster", "unsectioned"));
        }

        alerts.sort(Comparator.comparingInt(a -> switch (a.severity()) {
            case "critical" -> 0;
            case "warning" -> 1;
            default -> 2;
        }));
        return alerts;
    }

    private static String plural(int n, String one, String many) {
        return n + " " + (n == 1 ? one : many);
    }
}
