package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository.LearnerAttemptStats;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.TopicDifficultyDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.CertificationTopicsDto;
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

/**
 * How the institution's own people are actually doing.
 *
 * Scoped to one institution throughout -- the roster is derived from that
 * institution's assignment rows, and every rollup is keyed on those learner ids,
 * so a member of another tenant cannot appear here even by accident.
 *
 * The rollups (attempts, lessons) are each a single batched query over the whole
 * roster rather than a query per member. A per-member loop is the obvious way to
 * write this and it is what makes a large institution's dashboard crawl.
 */
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

    public InstitutionLearningStatsDto learningStats(Long institutionId) {
        List<InstitutionCertificationLearner> assignments =
                institutionCertLearnerRepository.findByInstitutionCert_Institution_InstitutionId(institutionId);

        // Insertion-ordered so the roster is stable between reloads even before
        // the sort below, which makes diffing a dashboard by eye possible.
        Set<Long> learnerIds = assignments.stream()
                .map(assignment -> assignment.getLearner().getLearnerId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        var institutionCerts = institutionCertRepository.findByInstitution_InstitutionId(institutionId);
        int seatsTotal = 0;
        int seatsUsed = 0;
        for (var institutionCert : institutionCerts) {
            seatsTotal += institutionCert.getTotalSlots() == null ? 0 : institutionCert.getTotalSlots();
            seatsUsed += institutionCert.getUsedSlots() == null ? 0 : institutionCert.getUsedSlots();
        }
        List<CertificationStatsDto> certificationStats = certificationStats(institutionCerts, assignments);

        if (learnerIds.isEmpty()) {
            return new InstitutionLearningStatsDto(
                    new LearningStatsSummaryDto(0, 0, 0, null, 0, 0, null, null, seatsTotal, seatsUsed),
                    List.of(),
                    certificationStats,
                    List.of(),
                    List.of());
        }

        Map<Long, LearnerAttemptStats> attemptStats = attemptRepository
                .statsByLearnerIds(learnerIds, AssessmentAttempt.Status.SUBMITTED).stream()
                .collect(Collectors.toMap(LearnerAttemptStats::getLearnerId, Function.identity()));

        Map<Long, Long> lessonsDone = completedLessonRepository
                .lessonsCompletedByLearnerIds(learnerIds).stream()
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

        // Least progress first: the dashboard exists to find who needs help, and
        // that reading should not require sorting the table by hand every visit.
        members.sort(Comparator.comparing(
                        (MemberLearningStatsDto m) -> m.averageProgress() == null
                                ? BigDecimal.ZERO
                                : m.averageProgress())
                .thenComparing(MemberLearningStatsDto::name,
                        Comparator.nullsLast(String::compareToIgnoreCase)));

        return new InstitutionLearningStatsDto(
                summary(members, seatsTotal, seatsUsed),
                members,
                certificationStats,
                hardestTopics(learnerIds),
                hardestAssessments(learnerIds));
    }

    /** Answers needed on a topic before the cohort's accuracy on it means anything. */
    private static final long MIN_TOPIC_ANSWERS = 3;

    /** How many rows each of the two difficulty lists returns. */
    private static final int DIFFICULTY_LIST_LIMIT = 5;

    /**
     * The topics this roster gets wrong most often, least accurate first.
     *
     * <p>Thin evidence is excluded rather than ranked: a topic answered once,
     * wrongly, is 0% accurate and would top this list every time while saying
     * nothing about the cohort. The learner count travels with each row so a
     * topic one person struggled with is not read as a department-wide gap.
     */
    private List<CertificationTopicsDto> hardestTopics(Collection<Long> learnerIds) {
        if (learnerIds.isEmpty()) return List.of();

        /* Grouped by programme rather than pooled. A department teaches
           courses, and "the weakest topics" pooled across all of them answers
           a question nobody asked: a head fixing the IT Passport syllabus
           cannot act on a list where three of the five rows are TOPCIT. */
        Map<Long, List<TopicDifficultyDto>> byCertification =
                attemptAnswerRepository.topicDifficulty(learnerIds, MIN_TOPIC_ANSWERS).stream()
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
                // The programme with the most topics in trouble goes first.
                .sorted(Comparator.comparingInt((CertificationTopicsDto c) -> c.topics().size()).reversed()
                        .thenComparing(CertificationTopicsDto::certificationTitle,
                                Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    /**
     * The assessments this roster does worst on, lowest pass rate first.
     *
     * <p>Ranked by pass rate rather than mean score because passing is the
     * thing being measured: a paper everyone scrapes through at 76% is not a
     * problem, and one everyone fails at 74% is.
     */
    private List<AssessmentOutcomeDto> hardestAssessments(Collection<Long> learnerIds) {
        if (learnerIds.isEmpty()) return List.of();
        return attemptRepository.examOutcomesByLearnerIds(learnerIds).stream()
                .filter(row -> row.getAttempts() > 0)
                .map(row -> new AssessmentOutcomeDto(
                        row.getExamId(),
                        row.getExamTitle(),
                        row.getExamType(),
                        row.getAttempts(),
                        row.getLearners(),
                        Math.round(100f * row.getPassedAttempts() / row.getAttempts()),
                        row.getAverageScore() == null ? null
                                : (int) Math.round(row.getAverageScore())))
                .sorted(Comparator.comparingInt(AssessmentOutcomeDto::passRate)
                        .thenComparing(Comparator.comparingLong(AssessmentOutcomeDto::attempts).reversed()))
                .limit(DIFFICULTY_LIST_LIMIT)
                .toList();
    }

    /**
     * Per-certification rollup: who is on each programme and how they are
     * doing on it.
     *
     * <p>Built from the assignments already loaded rather than a query per
     * certification -- the rows say which learner sits on which programme and
     * how far along they are, so the only thing that has to be fetched is who
     * has passed.
     *
     * <p>Revoked assignments are left out of every figure. A seat taken back
     * is not a learner failing to progress, and counting them would drag a
     * programme's average down for people who are no longer on it.
     */
    private List<CertificationStatsDto> certificationStats(
            List<InstitutionCertificate> institutionCerts,
            List<InstitutionCertificationLearner> assignments) {

        Set<Long> rosterIds = assignments.stream()
                .map(a -> a.getLearner().getLearnerId())
                .collect(Collectors.toSet());
        Map<Long, AssessmentAttemptRepository.CertificationScoreRow> scoreByCertification =
                rosterIds.isEmpty() ? Map.of()
                        : attemptRepository.certificationScoresByLearnerIds(rosterIds).stream()
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

        /* Every award for these learners in one read. Asking per assignment
           was a query each, which on a full roster is the whole page. */
        Set<String> passedPairs = awardRepository
                .findByLearnerIdIn(assignments.stream()
                        .map(a -> a.getLearner().getLearnerId())
                        .collect(Collectors.toSet()))
                .stream()
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

            /* Passing is a kind of progress, so someone who has passed is not
               also counted as in progress -- the three states add up to the
               enrolled count, which is what makes the row readable. */
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

        // Busiest programme first: a department looks at where its people are.
        rows.sort(Comparator.comparingInt(CertificationStatsDto::enrolled).reversed()
                .thenComparing(CertificationStatsDto::title,
                        Comparator.nullsLast(String::compareToIgnoreCase)));
        return rows;
    }

    /**
     * Completion per learning group, for the group-analytics panels.
     *
     * A group with assignees but no recorded progress reports a real 0, not a
     * null: the rows exist and their progress genuinely is zero, which is a
     * different situation from a group nobody has been assigned to.
     */
    public List<DepartmentProgressDto> groupProgress(Long institutionId) {
        return groupAssigneeRepository.groupProgressByInstitution(institutionId).stream()
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
                // Weighted by attempts so a member with one graded attempt does
                // not move the institution's average as much as one with forty.
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
