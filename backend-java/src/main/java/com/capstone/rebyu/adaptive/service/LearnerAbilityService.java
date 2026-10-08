package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.engine.AdaptiveSessionState;
import com.capstone.rebyu.adaptive.engine.BktModel;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.adaptive.entity.LearnerSkillState;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class LearnerAbilityService {

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

    @Transactional(readOnly = true)
    public Seed seed(Long learnerId, Long certificationId, Map<Long, Integer> poolCountByLesson) {
        Set<Long> lessonIds = poolCountByLesson.keySet();

        Map<Long, BktModel.Params> params = new LinkedHashMap<>();
        for (Long lessonId : lessonIds) {
            params.put(lessonId, bktParameters.forLesson(lessonId));
        }

        Map<Long, Double> pKnown = new LinkedHashMap<>();
        Map<Long, Double> fromService = new HashMap<>();
        if (!lessonIds.isEmpty()) {
            LearnerMasteryView mastery = masteryService.getMastery(learnerId, new ArrayList<>(lessonIds));
            if (mastery != null && mastery.items() != null) {
                for (LearnerMasteryView.Item item : mastery.items()) {
                    if (item.lessonId() != null && item.masteryProbability() != null) {
                        fromService.put(item.lessonId(), item.masteryProbability());
                    }
                }
            }
        }
        Map<Long, Double> stored = new HashMap<>();
        if (!lessonIds.isEmpty() && fromService.size() < lessonIds.size()) {
            for (LearnerSkillState state : skillStateRepository.findByLearnerIdAndLessonIdIn(learnerId, lessonIds)) {
                stored.put(state.getLessonId(), state.getPKnown());
            }
        }
        boolean anyEvidence = false;
        for (Long lessonId : lessonIds) {
            Double p = fromService.get(lessonId);
            if (p == null) p = stored.get(lessonId);
            if (p != null) anyEvidence = true;
            pKnown.put(lessonId, p != null ? p : params.get(lessonId).prior());
        }

        double mu0 = IrtModel.THETA_BASELINE;
        double sigma0 = IrtModel.standardError(mu0, List.of());
        return new Seed(mu0, sigma0, pKnown, params);
    }

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
