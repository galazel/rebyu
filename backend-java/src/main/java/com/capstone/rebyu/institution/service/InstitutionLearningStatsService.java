package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository.LearnerAttemptStats;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.TopicDifficultyDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.CertificationTopicsDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.CertificationAssessmentsDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.AssessmentOutcomeDto;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptAnswerRepository;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.CertificationStatsDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.InstitutionLearningStatsDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.DepartmentProgressDto;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.LearningStatsSummaryDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.MemberLearningStatsDto;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository.LessonsDone;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import java.util.Collection;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstitutionLearningStatsService {

    private final InstitutionCertificationLearnerRepository institutionCertLearnerRepository;
    private final InstitutionCertificateRepository institutionCertRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final LearnerCompletedLessonRepository completedLessonRepository;
    private final LearnerRepository learnerRepository;
    private final DepartmentLearnerRepository groupAssigneeRepository;
    private final com.capstone.rebyu.enrollment.repository.LearnerCertificationAwardRepository awardRepository;
    private final AssessmentAttemptAnswerRepository attemptAnswerRepository;

    private static final LocalDateTime ALL_TIME_START = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime ALL_TIME_END = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    public InstitutionLearningStatsDto learningStats(Long institutionId) {
        return learningStats(institutionId, null, null, null);
    }

    public InstitutionLearningStatsDto learningStats(
            Long institutionId, Collection<Long> departmentIds, LocalDateTime from, LocalDateTime to) {



        LocalDateTime start = from == null ? ALL_TIME_START : from;
        LocalDateTime end = to == null ? ALL_TIME_END : to;

        List<InstitutionCertificationLearner> assignments =
                institutionCertLearnerRepository.findByInstitutionCert_Institution_InstitutionId(institutionId);

        if (departmentIds != null) {
            if (departmentIds.isEmpty()) {
                return new InstitutionLearningStatsDto(
                        new LearningStatsSummaryDto(0, 0, 0, null, 0, 0, null, null, 0, 0),
                        List.of(), List.of(), List.of(), List.of());
            }
            Set<Long> taught = Set.copyOf(
                    groupAssigneeRepository.institutionCertLearnerIdsByDepartments(departmentIds));
            assignments = assignments.stream()
                    .filter(a -> taught.contains(a.getInstitutionCertLearnerId()))
                    .toList();
        }

        assignments = assignments.stream()
                .filter(a -> a.getAssignedAt() == null || !a.getAssignedAt().isAfter(end))
                .toList();

        Set<Long> learnerIds = assignments.stream()
                .map(assignment -> assignment.getLearner().getLearnerId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        var institutionCerts = departmentIds == null
                ? institutionCertRepository.findByInstitution_InstitutionId(institutionId)
                : seatRowsBehind(assignments);
        int seatsTotal = 0;
        int seatsUsed = 0;
        for (var institutionCert : institutionCerts) {
            seatsTotal += institutionCert.getTotalSlots() == null ? 0 : institutionCert.getTotalSlots();
            seatsUsed += institutionCert.getUsedSlots() == null ? 0 : institutionCert.getUsedSlots();
        }
        List<CertificationStatsDto> certificationStats = certificationStats(institutionCerts, assignments, start, end);

        if (learnerIds.isEmpty()) {
            return new InstitutionLearningStatsDto(
                    new LearningStatsSummaryDto(0, 0, 0, null, 0, 0, null, null, seatsTotal, seatsUsed),
                    List.of(),
                    certificationStats,
                    List.of(),
                    List.of());
        }

        Map<Long, LearnerAttemptStats> attemptStats = attemptRepository
                .statsByLearnerIds(learnerIds, AssessmentAttempt.Status.SUBMITTED, start, end).stream()
                .collect(Collectors.toMap(LearnerAttemptStats::getLearnerId, Function.identity()));

        Map<Long, Long> lessonsDone = completedLessonRepository
                .lessonsCompletedByLearnerIds(learnerIds, start, end).stream()
                .collect(Collectors.toMap(LessonsDone::getLearnerId, LessonsDone::getLessonsCompleted));

        Map<Long, Learner> learnerById = learnerRepository.findByLearnerIdIn(learnerIds).stream()
                .collect(Collectors.toMap(Learner::getLearnerId, Function.identity()));

        Map<Long, List<InstitutionCertificationLearner>> assignmentsByLearner = assignments.stream()
                .collect(Collectors.groupingBy(a -> a.getLearner().getLearnerId()));

        List<MemberLearningStatsDto> members = new ArrayList<>();
        for (Long learnerId : learnerIds) {
            members.add(member(
                    learnerId,
                    learnerById.get(learnerId),
                    assignmentsByLearner.getOrDefault(learnerId, List.of()),
                    attemptStats.get(learnerId),
                    lessonsDone.getOrDefault(learnerId, 0L)));
        }

        members.sort(Comparator.comparing(
                        (MemberLearningStatsDto m) -> m.averageProgress() == null
                                ? BigDecimal.ZERO
                                : m.averageProgress())
                .thenComparing(MemberLearningStatsDto::name,
                        Comparator.nullsLast(String::compareToIgnoreCase)));

        Set<Long> certificationIds = institutionCerts.stream()
                .map(InstitutionCertificate::getCertification)
                .filter(java.util.Objects::nonNull)
                .map(certification -> certification.getCertificationId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return new InstitutionLearningStatsDto(
                summary(members, seatsTotal, seatsUsed),
                members,
                certificationStats,
                hardestTopics(learnerIds, certificationIds, start, end),
                hardestAssessments(learnerIds, certificationIds, start, end));
    }

    private List<InstitutionCertificate> seatRowsBehind(
            List<InstitutionCertificationLearner> assignments) {
        Map<Long, InstitutionCertificate> byId = new LinkedHashMap<>();
        for (InstitutionCertificationLearner assignment : assignments) {
            InstitutionCertificate seatRow = assignment.getInstitutionCert();
            if (seatRow != null) {
                byId.putIfAbsent(seatRow.getInstitutionCertId(), seatRow);
            }
        }
        return List.copyOf(byId.values());
    }

    private static final long MIN_TOPIC_ANSWERS = 3;

    private static final int DIFFICULTY_LIST_LIMIT = 5;

    private List<CertificationTopicsDto> hardestTopics(
            Collection<Long> learnerIds, Collection<Long> certificationIds,
            LocalDateTime from, LocalDateTime to) {
        if (learnerIds.isEmpty() || certificationIds.isEmpty()) return List.of();

        Map<Long, List<TopicDifficultyDto>> byCertification =
                attemptAnswerRepository.topicDifficulty(learnerIds, certificationIds, MIN_TOPIC_ANSWERS, from, to).stream()
                        .filter(row -> row.getCertificationId() != null)
                        .map(row -> new TopicDifficultyDto(
                                row.getLessonId(),
                                row.getLessonTitle(),
                                row.getCategoryTitle(),
                                row.getCertificationId(),
                                row.getCertificationTitle(),
                                Math.round(100f * row.getCorrect() / row.getAnswered()),
                                row.getAnswered(),
                                row.getLearners()))
                        .collect(Collectors.groupingBy(TopicDifficultyDto::certificationId,
                                LinkedHashMap::new, Collectors.toList()));

        return byCertification.values().stream()
                .map(topics -> {
                    List<TopicDifficultyDto> worst = topics.stream()
                            .sorted(Comparator.comparingInt(TopicDifficultyDto::accuracy)
                                    .thenComparing(Comparator.comparingLong(TopicDifficultyDto::learners).reversed()))
                            .limit(DIFFICULTY_LIST_LIMIT)
                            .toList();
                    return new CertificationTopicsDto(
                            worst.get(0).certificationId(),
                            worst.get(0).certificationTitle(),
                            worst);
                })
                .sorted(Comparator.comparingInt((CertificationTopicsDto c) -> c.topics().size()).reversed()
                        .thenComparing(CertificationTopicsDto::certificationTitle,
                                Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private List<CertificationAssessmentsDto> hardestAssessments(
            Collection<Long> learnerIds, Collection<Long> certificationIds,
            LocalDateTime from, LocalDateTime to) {
        if (learnerIds.isEmpty() || certificationIds.isEmpty()) return List.of();

        record Outcome(Long certificationId, String certificationTitle, AssessmentOutcomeDto exam) {}

        Map<Long, List<Outcome>> byCertification =
                attemptRepository.examOutcomesByLearnerIds(learnerIds, certificationIds, from, to).stream()
                        .filter(row -> row.getAttempts() > 0)
                        .filter(row -> row.getCertificationId() != null)
                        .map(row -> new Outcome(
                                row.getCertificationId(),
                                row.getCertificationTitle(),
                                new AssessmentOutcomeDto(
                                        row.getExamId(),
                                        row.getExamTitle(),
                                        row.getExamType(),
                                        row.getAttempts(),
                                        row.getLearners(),
                                        Math.round(100f * row.getPassedAttempts() / row.getAttempts()),
                                        row.getAverageScore() == null ? null
                                                : (int) Math.round(row.getAverageScore()),
                                        row.getPassingScore() == null ? null
                                                : row.getPassingScore().setScale(0, RoundingMode.HALF_UP).intValue(),
                                        row.getPassedAttempts())))
                        .collect(Collectors.groupingBy(Outcome::certificationId,
                                LinkedHashMap::new, Collectors.toList()));

        return byCertification.values().stream()
                .map(outcomes -> {
                    List<AssessmentOutcomeDto> worst = outcomes.stream()
                            .map(Outcome::exam)
                            .sorted(Comparator.comparingInt(AssessmentOutcomeDto::passRate)
                                    .thenComparing(Comparator.comparingLong(AssessmentOutcomeDto::attempts).reversed()))
                            .limit(DIFFICULTY_LIST_LIMIT)
                            .toList();
                    return new CertificationAssessmentsDto(
                            outcomes.get(0).certificationId(),
                            outcomes.get(0).certificationTitle(),
                            worst);
                })
                .sorted(Comparator.comparingInt((CertificationAssessmentsDto c) -> c.assessments().size()).reversed()
                        .thenComparing(CertificationAssessmentsDto::certificationTitle,
                                Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private List<CertificationStatsDto> certificationStats(
            List<InstitutionCertificate> institutionCerts,
            List<InstitutionCertificationLearner> assignments,
            LocalDateTime from, LocalDateTime to) {

        Set<Long> rosterIds = assignments.stream()
                .map(a -> a.getLearner().getLearnerId())
                .collect(Collectors.toSet());
        Map<Long, AssessmentAttemptRepository.CertificationScoreRow> scoreByCertification =
                rosterIds.isEmpty() ? Map.of()
                        : attemptRepository.certificationScoresByLearnerIds(rosterIds, from, to).stream()
                                .filter(row -> row.getCertificationId() != null)
                                .collect(Collectors.toMap(
                                        AssessmentAttemptRepository.CertificationScoreRow::getCertificationId,
                                        Function.identity(),
                                        (a, b) -> a));

        Map<Long, List<InstitutionCertificationLearner>> byCertification = assignments.stream()
                .filter(a -> a.getStatus() != InstitutionCertificationLearner.Status.revoked)
                .filter(a -> a.getInstitutionCert() != null
                        && a.getInstitutionCert().getCertification() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getInstitutionCert().getCertification().getCertificationId()));

        Set<String> passedPairs = awardRepository
                .findByLearnerIdIn(assignments.stream()
                        .map(a -> a.getLearner().getLearnerId())
                        .collect(Collectors.toSet()))
                .stream()
                .filter(award -> award.getCreatedAt() == null || !award.getCreatedAt().isAfter(to))
                .map(award -> award.getLearnerId() + ":" + award.getCertificationId())
                .collect(Collectors.toSet());

        List<CertificationStatsDto> rows = new ArrayList<>();
        for (InstitutionCertificate institutionCert : institutionCerts) {
            var certification = institutionCert.getCertification();
            if (certification == null) continue;
            Long certificationId = certification.getCertificationId();
            List<InstitutionCertificationLearner> onIt =
                    byCertification.getOrDefault(certificationId, List.of());

            int enrolled = onIt.size();
            int passed = 0;
            int started = 0;
            BigDecimal progressTotal = BigDecimal.ZERO;

            for (InstitutionCertificationLearner assignment : onIt) {
                BigDecimal progress = assignment.getProgressPercentage() == null
                        ? BigDecimal.ZERO : assignment.getProgressPercentage();
                progressTotal = progressTotal.add(progress);
                if (progress.signum() > 0) started++;
                if (passedPairs.contains(assignment.getLearner().getLearnerId() + ":" + certificationId)) {
                    passed++;
                }
            }

            var scores = scoreByCertification.get(certificationId);

            int inProgress = Math.max(0, started - passed);
            int notStarted = Math.max(0, enrolled - started);

            rows.add(new CertificationStatsDto(
                    certificationId,
                    certification.getTitle(),
                    institutionCert.getTotalSlots() == null ? 0 : institutionCert.getTotalSlots(),
                    institutionCert.getUsedSlots() == null ? 0 : institutionCert.getUsedSlots(),
                    enrolled,
                    passed,
                    inProgress,
                    notStarted,
                    enrolled == 0 ? null
                            : progressTotal.divide(BigDecimal.valueOf(enrolled), 1, RoundingMode.HALF_UP),
                    enrolled == 0 ? null : Math.round(100f * passed / enrolled),
                    scores == null || scores.getAverageScore() == null ? null
                            : (int) Math.round(scores.getAverageScore()),
                    scores == null ? 0L : scores.getAttempts(),
                    scores == null || scores.getAttempts() == 0 ? null
                            : Math.round(100f * scores.getPassedAttempts() / scores.getAttempts())));
        }

        rows.sort(Comparator.comparingInt(CertificationStatsDto::enrolled).reversed()
                .thenComparing(CertificationStatsDto::title,
                        Comparator.nullsLast(String::compareToIgnoreCase)));
        return rows;
    }

    public List<DepartmentProgressDto> groupProgress(Long institutionId) {
        return groupProgress(institutionId, null, null);
    }

    public List<DepartmentProgressDto> groupProgress(
            Long institutionId, Collection<Long> departmentIds, LocalDateTime asOf) {
        Set<Long> mine = departmentIds == null ? null : Set.copyOf(departmentIds);
        if (mine != null && mine.isEmpty()) return List.of();

        return groupAssigneeRepository
                .groupProgressByInstitution(institutionId, asOf == null ? ALL_TIME_END : asOf).stream()
                .filter(row -> mine == null || mine.contains(row.getDepartmentId()))
                .map(row -> new DepartmentProgressDto(
                        row.getDepartmentId(),
                        row.getDepartmentName(),
                        row.getLearners(),
                        row.getAverageProgress() == null
                                ? BigDecimal.ZERO
                                : BigDecimal.valueOf(row.getAverageProgress())
                                        .setScale(1, RoundingMode.HALF_UP),
                        row.getCompletedLearners()))
                .toList();
    }

    private MemberLearningStatsDto member(
            Long learnerId,
            Learner learner,
            List<InstitutionCertificationLearner> assignments,
            LearnerAttemptStats stats,
            long lessonsCompleted) {

        int active = 0;
        int completed = 0;
        BigDecimal progressSum = BigDecimal.ZERO;
        for (InstitutionCertificationLearner assignment : assignments) {
            if (assignment.getStatus() == InstitutionCertificationLearner.Status.active) {
                active++;
            }
            if (assignment.getCompletedAt() != null) {
                completed++;
            }
            progressSum = progressSum.add(
                    assignment.getProgressPercentage() == null
                            ? BigDecimal.ZERO
                            : assignment.getProgressPercentage());
        }

        BigDecimal averageProgress = assignments.isEmpty() ? null
                : progressSum.divide(BigDecimal.valueOf(assignments.size()), 1, RoundingMode.HALF_UP);

        long attempts = stats == null ? 0 : stats.getAttempts();
        long passed = stats == null ? 0 : stats.getPassedAttempts();
        Double average = stats == null ? null : stats.getAverageScore();
        LocalDateTime lastActivity = stats == null ? null : stats.getLastSubmittedAt();

        return new MemberLearningStatsDto(
                learnerId,
                displayName(learner, learnerId),
                learner == null ? null : learner.getUsername(),
                assignments.size(),
                active,
                completed,
                averageProgress,
                lessonsCompleted,
                attempts,
                passed,
                attempts == 0 ? null : (int) Math.round(passed * 100.0 / attempts),
                average == null ? null : (int) Math.round(average),
                lastActivity);
    }

    private LearningStatsSummaryDto summary(
            List<MemberLearningStatsDto> members, int seatsTotal, int seatsUsed) {

        long gradedAttempts = 0;
        long passedAttempts = 0;
        long lessonsCompleted = 0;
        long scoreWeight = 0;
        double scoreTotal = 0;
        int activeMembers = 0;
        int withProgress = 0;
        BigDecimal progressSum = BigDecimal.ZERO;

        for (MemberLearningStatsDto member : members) {
            gradedAttempts += member.gradedAttempts();
            passedAttempts += member.passedAttempts();
            lessonsCompleted += member.lessonsCompleted();
            if (member.gradedAttempts() > 0 || member.lessonsCompleted() > 0) {
                activeMembers++;
            }
            if (member.averageScore() != null) {
                scoreTotal += member.averageScore() * member.gradedAttempts();
                scoreWeight += member.gradedAttempts();
            }
            if (member.averageProgress() != null) {
                progressSum = progressSum.add(member.averageProgress());
                withProgress++;
            }
        }

        return new LearningStatsSummaryDto(
                members.size(),
                activeMembers,
                members.size() - activeMembers,
                withProgress == 0 ? null
                        : progressSum.divide(BigDecimal.valueOf(withProgress), 1, RoundingMode.HALF_UP),
                lessonsCompleted,
                gradedAttempts,
                gradedAttempts == 0 ? null : (int) Math.round(passedAttempts * 100.0 / gradedAttempts),
                scoreWeight == 0 ? null : (int) Math.round(scoreTotal / scoreWeight),
                seatsTotal,
                seatsUsed);
    }

    private String displayName(Learner learner, Long learnerId) {
        if (learner == null) {
            return "Learner #" + learnerId;
        }
        String full = ((learner.getFirstName() == null ? "" : learner.getFirstName()) + " "
                + (learner.getLastName() == null ? "" : learner.getLastName())).trim();
        if (!full.isEmpty()) {
            return full;
        }
        return learner.getUsername() == null ? "Learner #" + learnerId : learner.getUsername();
    }
}
