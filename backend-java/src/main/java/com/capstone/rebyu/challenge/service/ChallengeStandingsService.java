package com.capstone.rebyu.challenge.service;

import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeActivityRow;
import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeLeaderboardRow;
import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeRecord;
import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChallengeStandingsService {

    private static final int MAX_LEADERBOARD_ROWS = 50;
    private static final int RECENT_ACTIVITY_ROWS = 8;

    private final AssessmentAttemptRepository attempts;
    private final LearnerRepository learners;

    private record Standing(Long learnerId, String name, int points, int completed, int bestScore) {}

    public List<ChallengeLeaderboardRow> leaderboard(Long viewerLearnerId, int limit) {
        List<Standing> standings = standings();
        int size = Math.min(Math.max(limit, 1), MAX_LEADERBOARD_ROWS);

        List<ChallengeLeaderboardRow> rows = new ArrayList<>();
        for (int index = 0; index < standings.size() && index < size; index++) {
            Standing standing = standings.get(index);
            rows.add(new ChallengeLeaderboardRow(
                    index + 1L,
                    standing.name(),
                    standing.points(),
                    standing.completed(),
                    standing.bestScore(),
                    standing.learnerId().equals(viewerLearnerId)));
        }
        return rows;
    }

    public ChallengeRecord record(Long learnerId) {
        List<Standing> standings = standings();
        Long rank = null;
        Standing mine = null;
        for (int index = 0; index < standings.size(); index++) {
            if (standings.get(index).learnerId().equals(learnerId)) {
                rank = index + 1L;
                mine = standings.get(index);
                break;
            }
        }

        List<AssessmentAttempt> runs = attempts.findByLearnerIdAndExam_ExamType_ExamTypeText(
                learnerId, ChallengeArenaService.CHALLENGE_EXAM_TYPE);

        List<ChallengeActivityRow> recent = runs.stream()
                .sorted(Comparator.comparing(
                        AssessmentAttempt::getStartedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_ACTIVITY_ROWS)
                .map(run -> new ChallengeActivityRow(
                        run.getAssessmentAttemptId(),
                        run.getExam() == null ? null : run.getExam().getTitle(),
                        run.getStartedAt(),
                        run.getStatus() == null ? null : run.getStatus().name(),
                        score(run)))
                .toList();

        return new ChallengeRecord(
                rank,
                mine == null ? 0 : mine.points(),
                mine == null ? 0 : mine.completed(),
                mine == null ? 0 : mine.bestScore(),
                streakDays(runs),
                recent);
    }

    private List<Standing> standings() {
        Map<Long, int[]> totals = new LinkedHashMap<>();
        for (AssessmentAttempt run : attempts.findByStatusAndExam_ExamType_ExamTypeText(
                AssessmentAttempt.Status.SUBMITTED, ChallengeArenaService.CHALLENGE_EXAM_TYPE)) {
            Integer score = score(run);
            if (score == null || run.getLearnerId() == null) {
                continue;
            }
            int[] t = totals.computeIfAbsent(run.getLearnerId(), id -> new int[3]);
            t[0] += score;
            t[1] += 1;
            t[2] = Math.max(t[2], score);
        }

        Map<Long, Standing> byLearner = new LinkedHashMap<>();
        for (Learner learner : learners.findAllById(totals.keySet())) {
            int[] t = totals.get(learner.getLearnerId());
            byLearner.put(learner.getLearnerId(),
                    new Standing(learner.getLearnerId(), displayName(learner), t[0], t[1], t[2]));
        }

        return byLearner.values().stream()
                .sorted(Comparator.comparingInt(Standing::points).reversed()
                        .thenComparing(Comparator.comparingInt(Standing::bestScore).reversed())
                        .thenComparing(Standing::learnerId))
                .toList();
    }

    private String displayName(Learner learner) {
        String username = learner.getUsername();
        if (username != null && !username.isBlank()) {
            return username;
        }
        String first = learner.getFirstName() == null ? "" : learner.getFirstName().trim();
        String last = learner.getLastName() == null ? "" : learner.getLastName().trim();
        if (!first.isEmpty() && !last.isEmpty()) {
            return first + " " + last.charAt(0) + ".";
        }
        if (!first.isEmpty()) {
            return first;
        }
        return "Learner " + learner.getLearnerId();
    }

    private static Integer score(AssessmentAttempt run) {
        BigDecimal percentage = run.getPercentage();
        return percentage == null ? null : percentage.intValue();
    }

    private int streakDays(List<AssessmentAttempt> runs) {
        Set<LocalDate> days = new HashSet<>();
        for (AssessmentAttempt run : runs) {
            if (run.getStartedAt() != null) {
                days.add(run.getStartedAt().toLocalDate());
            }
        }
        if (days.isEmpty()) {
            return 0;
        }

        LocalDate cursor = LocalDate.now();
        if (!days.contains(cursor)) {
            cursor = cursor.minusDays(1);
        }

        int streak = 0;
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
