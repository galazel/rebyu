package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.engine.AdaptiveSessionState;
import com.capstone.rebyu.adaptive.engine.BktModel;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.adaptive.entity.LearnerAbility;
import com.capstone.rebyu.adaptive.entity.LearnerSkillState;
import com.capstone.rebyu.adaptive.repository.LearnerAbilityRepository;
import com.capstone.rebyu.adaptive.repository.LearnerSkillStateRepository;
import com.capstone.rebyu.bkt.dto.LearnerMasteryView;
import com.capstone.rebyu.bkt.service.LearnerMasteryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * What the learner brings into a session: their ability in this
 * certification as the last session left it, and their knowledge state per
 * lesson. Both persisted back at the end, so the next session starts here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearnerAbilityService {

    /** How many past responses it takes for the stored ability to outweigh the BKT-derived one. */
    private static final double STORED_WEIGHT_HALF_LIFE = 8.0;

    private final LearnerAbilityRepository abilityRepository;
    private final LearnerSkillStateRepository skillStateRepository;
    private final LearnerMasteryService masteryService;
    private final BktParameterProvider bktParameters;

    public static String scopeKey(Long certificationId) {
        return "CERT:" + certificationId;
    }

    public record Seed(double mu0, double sigma0,
                       Map<Long, Double> pKnownByLesson,
                       Map<Long, BktModel.Params> paramsByLesson) {
    }

    /**
     * Prior ability and per-lesson knowledge for a session over these lessons.
     * The lesson weights are the pool sizes, so the BKT-derived prior reflects
     * the lessons the session will actually draw on.
     */
    @Transactional(readOnly = true)
    public Seed seed(Long learnerId, Long certificationId, Map<Long, Integer> poolCountByLesson) {
        Set<Long> lessonIds = poolCountByLesson.keySet();

        Map<Long, BktModel.Params> params = new LinkedHashMap<>();
        for (Long lessonId : lessonIds) {
            params.put(lessonId, bktParameters.forLesson(lessonId));
        }

        Map<Long, Double> pKnown = new LinkedHashMap<>();
        Map<Long, Double> stored = new HashMap<>();
        if (!lessonIds.isEmpty()) {
            for (LearnerSkillState state : skillStateRepository.findByLearnerIdAndLessonIdIn(learnerId, lessonIds)) {
                stored.put(state.getLessonId(), state.getPKnown());
            }
        }
        Map<Long, Double> fromService = new HashMap<>();
        if (!lessonIds.isEmpty() && stored.size() < lessonIds.size()) {
            LearnerMasteryView mastery = masteryService.getMastery(learnerId, new ArrayList<>(lessonIds));
            if (mastery != null && mastery.items() != null) {
                for (LearnerMasteryView.Item item : mastery.items()) {
                    if (item.lessonId() != null && item.masteryProbability() != null) {
                        fromService.put(item.lessonId(), item.masteryProbability());
                    }
                }
            }
        }
        boolean anyEvidence = false;
        for (Long lessonId : lessonIds) {
            Double p = stored.get(lessonId);
            if (p == null) p = fromService.get(lessonId);
            if (p != null) anyEvidence = true;
            pKnown.put(lessonId, p != null ? p : params.get(lessonId).prior());
        }

        double thetaBkt = 0.0;
        if (anyEvidence) {
            double weighted = 0.0;
            double weight = 0.0;
            for (Map.Entry<Long, Integer> entry : poolCountByLesson.entrySet()) {
                double w = Math.max(1, entry.getValue());
                weighted += w * pKnown.get(entry.getKey());
                weight += w;
            }
            thetaBkt = IrtModel.clamp(IrtModel.logit(weighted / weight), -2.0, 2.0);
        }

        LearnerAbility ability = abilityRepository
                .findByLearnerIdAndScopeKey(learnerId, scopeKey(certificationId)).orElse(null);
        double w = ability == null ? 0.0
                : ability.getResponseCount() / (ability.getResponseCount() + STORED_WEIGHT_HALF_LIFE);
        double mu0 = ability == null ? thetaBkt : w * ability.getTheta() + (1 - w) * thetaBkt;
        double sigma0 = ability == null ? 1.0 : Math.max(0.5, w * ability.getStandardError() + (1 - w) * 1.0);
        return new Seed(mu0, sigma0, pKnown, params);
    }

    /** Writes the session's ability estimate back, with how many responses it rests on. */
    @Transactional
    public void persistAbility(Long learnerId, Long certificationId, AdaptiveSessionState state, int responsesThisSession) {
        String key = scopeKey(certificationId);
        LearnerAbility ability = abilityRepository.findByLearnerIdAndScopeKey(learnerId, key)
                .orElseGet(() -> LearnerAbility.builder()
                        .learnerId(learnerId).scopeKey(key).responseCount(0).build());
        ability.setTheta(state.getTheta());
        ability.setStandardError(state.getSe());
        ability.setResponseCount(Math.max(ability.getResponseCount(), 0) + Math.max(0, responsesThisSession));
        ability.setUpdatedAt(LocalDateTime.now());
        abilityRepository.save(ability);
    }

    /** Writes the per-lesson knowledge states back; called when the session ends. */
    @Transactional
    public void persistSkillStates(Long learnerId, AdaptiveSessionState state) {
        Map<Long, Long> evidence = new HashMap<>();
        for (AdaptiveSessionState.ResponseRecord response : state.getResponses()) {
            evidence.merge(response.getLessonId(), 1L, Long::sum);
        }
        if (evidence.isEmpty()) return;
        Map<Long, LearnerSkillState> existing = new HashMap<>();
        for (LearnerSkillState s : skillStateRepository.findByLearnerIdAndLessonIdIn(learnerId, evidence.keySet())) {
            existing.put(s.getLessonId(), s);
        }
        List<LearnerSkillState> toSave = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (Map.Entry<Long, Long> entry : evidence.entrySet()) {
            Double p = state.getPKnownByLesson().get(entry.getKey());
            if (p == null) continue;
            LearnerSkillState row = existing.computeIfAbsent(entry.getKey(), ((Function<Long, LearnerSkillState>) id ->
                    LearnerSkillState.builder().learnerId(learnerId).lessonId(id).evidenceCount(0).build()));
            row.setPKnown(p);
            row.setEvidenceCount(row.getEvidenceCount() + entry.getValue().intValue());
            row.setUpdatedAt(now);
            toSave.add(row);
        }
        skillStateRepository.saveAll(toSave);
    }
}
