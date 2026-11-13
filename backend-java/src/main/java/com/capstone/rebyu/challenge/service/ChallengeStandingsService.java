package com.capstone.rebyu.challenge.service;

import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeActivityRow;
import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeLeaderboardRow;
import com.capstone.rebyu.challenge.dto.ChallengeStandingsDtos.ChallengeRecord;
import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptQuestionRepository;
import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import java.util.HashMap;
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

    private static final double DEFAULT_STAGE_POINTS = 10;

    private final AssessmentAttemptRepository attempts;
    private final AssessmentAttemptQuestionRepository attemptQuestions;
    private final ExamQuestionRepository examQuestions;
    private final LearnerRepository learners;

    private record Standing(Long learnerId, String name, int points, int completed, int bestScore) {}

    public List<ChallengeLeaderboardRow> leaderboard(Long viewerLearnerId, int limit) {
        return leaderboard(viewerLearnerId, limit, null);
    }

    /** One challenge's ranking when {@code arenaId} is set, every challenge combined otherwise. */
    public List<ChallengeLeaderboardRow> leaderboard(Long viewerLearnerId, int limit, String arenaId) {
        List<Standing> standings = standings(arenaId);
        int size = Math.min(Math.max(limit, 1), MAX_LEADERBOARD_ROWS);

        List<ChallengeLeaderboardRow> rows = new ArrayList<>();
        for (int index = 0; index < standings.size() && index < size; index++) {
            Standing standing = standings.get(index);
            rows.add(new ChallengeLeaderboardRow(
                    sharedRank(standings, index),
                    standing.name(),
                    standing.points(),
                    standing.completed(),
                    standing.bestScore(),
                    standing.learnerId().equals(viewerLearnerId)));
        }
        return rows;
    }

    /** Learners level on points and best score share a rank (1, 2, 2, 4), not an id-ordered one. */
    private static long sharedRank(List<Standing> standings, int index) {
        int first = index;
        Standing standing = standings.get(index);
        while (first > 0) {
            Standing above = standings.get(first - 1);
            if (above.points() != standing.points() || above.bestScore() != standing.bestScore()) break;
            first--;
        }
        return first + 1L;
    }

    public ChallengeRecord record(Long learnerId) {
        List<Standing> standings = standings(null);
        Long rank = null;
        Standing mine = null;
        for (int index = 0; index < standings.size(); index++) {
            if (standings.get(index).learnerId().equals(learnerId)) {
                rank = sharedRank(standings, index);
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

    /**
     * Points are earned per stage, not per run: each stage counts once, at the learner's
     * best score on it, scaled to that stage's points (a 10-point stage at 80% gives 8).
     * Replaying a stage can raise its points but never stacks them. Learners with no
     * points yet are left off the board.
     */
    private List<Standing> standings(String arenaId) {
        // best score per learner, per stage (exam + problem)
        Map<Long, Map<String, Integer>> best = new LinkedHashMap<>();
        Map<Long, Map<Long, BigDecimal>> stagePoints = new HashMap<>();
        for (AssessmentAttemptQuestionRepository.ChallengeRunView run :
                attemptQuestions.findSubmittedChallengeRuns(ChallengeArenaService.CHALLENGE_EXAM_TYPE)) {
            if (arenaId != null && !arenaId.equals(run.getArenaId())) continue;
            if (run.getLearnerId() == null || run.getQuestionId() == null || run.getPercentage() == null) continue;
            int score = Math.max(0, Math.min(100, run.getPercentage().intValue()));
            best.computeIfAbsent(run.getLearnerId(), id -> new HashMap<>())
                    .merge(run.getExamId() + ":" + run.getQuestionId(), score, Math::max);
            stagePoints.computeIfAbsent(run.getExamId(), this::pointsByQuestion);
        }

        Map<Long, int[]> totals = new LinkedHashMap<>();
        best.forEach((learnerId, stages) -> {
            int[] t = new int[3];
            double points = 0;
            for (Map.Entry<String, Integer> stage : stages.entrySet()) {
                String[] key = stage.getKey().split(":");
                BigDecimal worth = stagePoints.getOrDefault(Long.valueOf(key[0]), Map.of())
                        .get(Long.valueOf(key[1]));
                double value = worth == null || worth.signum() <= 0 ? DEFAULT_STAGE_POINTS : worth.doubleValue();
                points += value * stage.getValue() / 100.0;
                t[1] += 1;
                t[2] = Math.max(t[2], stage.getValue());
            }
            t[0] = (int) Math.round(points);
            if (t[0] > 0) totals.put(learnerId, t);
        });

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

    private Map<Long, BigDecimal> pointsByQuestion(Long examId) {
        Map<Long, BigDecimal> byQuestion = new HashMap<>();
        for (ExamQuestion row : examQuestions.findByExam_ExamIdOrderByDisplayOrderAsc(examId)) {
            if (row.getQuestion() != null) byQuestion.put(row.getQuestion().getQuestionId(), row.getPoints());
        }
        return byQuestion;
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
