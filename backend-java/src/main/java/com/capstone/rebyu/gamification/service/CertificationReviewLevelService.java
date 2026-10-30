package com.capstone.rebyu.gamification.service;

import com.capstone.rebyu.gamification.entity.CertificationReviewLevel;
import com.capstone.rebyu.gamification.entity.LearnerRewardBalance;
import com.capstone.rebyu.gamification.repository.CertificationReviewLevelRepository;
import com.capstone.rebyu.gamification.repository.LearnerRewardBalanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class CertificationReviewLevelService {
    private final CertificationReviewLevelRepository levels;
    private final LearnerRewardBalanceRepository balances;

    /** The rank shown next to a learner's name, e.g. in the community feed. */
    public record LearnerLevel(int levelNumber, String title, String imageKey) {}

    /** Each learner's current rank from their XP, in two queries however many learners. */
    @Transactional public Map<Long, LearnerLevel> levelsFor(Collection<Long> learnerIds) {
        Set<Long> ids = new HashSet<>(learnerIds);
        ids.remove(null);
        if (ids.isEmpty()) return Map.of();
        List<CertificationReviewLevel> ladder = all();
        Map<Long, Long> xp = new HashMap<>();
        for (LearnerRewardBalance balance : balances.findAllById(ids)) xp.put(balance.getLearnerId(), balance.getXpBalance());
        Map<Long, LearnerLevel> result = new HashMap<>();
        for (Long id : ids) {
            long points = xp.getOrDefault(id, 0L);
            CertificationReviewLevel current = ladder.stream().filter(row -> row.getRequiredXp() <= points)
                    .reduce((a, b) -> b).orElse(ladder.getFirst());
            result.put(id, new LearnerLevel(current.getLevelNumber(), current.getTitle(), current.getImageKey()));
        }
        return result;
    }
    private static final String[] TITLES = {"Newcomer","Learner","Apprentice","Knowledge Seeker","Bookworm","Scholar","Achiever","Specialist","Analyst","Expert","Strategist","Virtuoso","Mastermind","Grand Scholar","Elite Scholar","Prodigy","Genius","Luminary","Grandmaster","Legendary Scholar"};
    private static final long[] XP = {0,100,250,450,700,1000,1400,1900,2500,3200,4000,5000,6200,7600,9200,11000,13000,15500,18500,22000};

    @Transactional public List<CertificationReviewLevel> all() {
        if (levels.count() == 0) levels.saveAll(defaults());
        return levels.findAllByOrderByLevelNumberAsc();
    }
    @Transactional public List<CertificationReviewLevel> replace(List<CertificationReviewLevel> requested) {
        if (requested == null || requested.size() != 20) throw new IllegalArgumentException("Configure exactly 20 review levels.");
        List<CertificationReviewLevel> ordered = new ArrayList<>(requested);
        ordered.sort(Comparator.comparingInt(CertificationReviewLevel::getLevelNumber));
        for (int i=0;i<20;i++) {
            CertificationReviewLevel row=ordered.get(i);
            if (row.getLevelNumber()!=i+1 || row.getTitle()==null || row.getTitle().isBlank() || row.getRequiredXp() < (i==0?0:ordered.get(i-1).getRequiredXp()))
                throw new IllegalArgumentException("Levels must run from 1 to 20 with increasing XP requirements.");
        }
        levels.deleteAllInBatch();
        ordered.forEach(row -> row.setId(null));
        return levels.saveAll(ordered);
    }
    @Transactional public CertificationReviewLevel setImage(int levelNumber, String imageKey) {
        CertificationReviewLevel row = levels.findAllByOrderByLevelNumberAsc().stream()
                .filter(level -> level.getLevelNumber() == levelNumber).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Review level not found."));
        row.setImageKey(imageKey);
        return levels.save(row);
    }
    private static List<CertificationReviewLevel> defaults() {
        List<CertificationReviewLevel> result=new ArrayList<>();
        for(int i=0;i<20;i++) result.add(CertificationReviewLevel.builder().levelNumber(i+1).title(TITLES[i]).requiredXp(XP[i]).description(i<5?"Learning the basics":i<10?"Building knowledge and skills":i<15?"Mastering difficult concepts":"The highest certification-review ranks").build());
        return result;
    }
}
