package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.engine.AdaptiveItemSelector.Candidate;
import com.capstone.rebyu.adaptive.engine.IrtModel;
import com.capstone.rebyu.aigateway.entity.GenerationRequest;
import com.capstone.rebyu.aigateway.repository.GenerationRequestRepository;
import com.capstone.rebyu.aigateway.service.GenerationRequestProducer;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankReplenishmentService {

    public static final String PARAM_REPLENISH = "replenish";
    public static final String PARAM_DIFFICULTY = "difficultyFocus";
    public static final String PARAM_AUTO_APPROVE = "autoApprove";

    private final AdaptiveProperties properties;
    private final GenerationRequestRepository requests;
    private final GenerationRequestProducer producer;
    private final ObjectMapper objectMapper;

    public record LevelUse(String level, int pool, int seen, int paperLength) {
        public double share() {
            return pool == 0 ? 1.0 : (double) seen / pool;
        }
    }

    public static Map<String, LevelUse> usage(Collection<Candidate> pool, Set<Long> seen, int paperLength) {
        Map<String, int[]> counts = new LinkedHashMap<>();
        for (Candidate c : pool) {
            if (c.workspace()) continue;
            String level = levelOf(c.params().b());
            int[] tally = counts.computeIfAbsent(level, l -> new int[2]);
            tally[0]++;
            if (seen.contains(c.questionId())) tally[1]++;
        }
        Map<String, LevelUse> out = new LinkedHashMap<>();
        counts.forEach((level, tally) -> out.put(level, new LevelUse(level, tally[0], tally[1], paperLength)));
        return out;
    }

    static String levelOf(double b) {
        if (b <= (IrtModel.DIFFICULTY_EASY + IrtModel.DIFFICULTY_AVERAGE) / 2) return "EASY";
        if (b >= (IrtModel.DIFFICULTY_AVERAGE + IrtModel.DIFFICULTY_HARD) / 2) return "HARD";
        return "AVERAGE";
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void replenishIfDepleted(Long certificationId, String certificationTitle, Map<String, LevelUse> usage) {
        if (!properties.isReplenishEnabled() || certificationId == null) return;
        for (LevelUse use : usage.values()) {
            if (use.share() < properties.getReplenishSeenShare()) continue;
            if (hasOpenRequest(certificationId, use.level())) continue;
            try {
                request(certificationId, certificationTitle, use);
            } catch (Exception e) {
                log.warn("Could not request more {} questions for certification {}: {}",
                        use.level(), certificationId, e.getMessage());
            }
        }
    }

    private boolean hasOpenRequest(Long certificationId, String level) {
        LocalDateTime since = LocalDateTime.now().minusHours(properties.getReplenishCooldownHours());
        return requests.existsRecentReplenishment(
                certificationId, "\"" + PARAM_DIFFICULTY + "\":\"" + level + "\"", since);
    }

    private void request(Long certificationId, String certificationTitle, LevelUse use) throws Exception {
        int count = Math.max(properties.getReplenishMinBatch(), use.paperLength());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("certificationId", certificationId);
        params.put("targetQuestionCount", count);
        params.put(PARAM_DIFFICULTY, use.level());
        params.put(PARAM_AUTO_APPROVE, true);
        params.put(PARAM_REPLENISH, true);
        params.put("additionalInstructions",
                "Every question in this batch must be " + use.level() + " difficulty: the adaptive "
                + "bank has run low at that level.");
        GenerationRequest row = requests.save(GenerationRequest.builder()
                .certificationId(certificationId)
                .requestType(GenerationRequest.RequestType.QUESTION)
                .paramsJson(objectMapper.writeValueAsString(params))
                .status(GenerationRequest.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .build());
        producer.publishQuestionGenerationRequested(row.getGenerationRequestId(), certificationId);
        log.info("Bank of '{}' is {}% seen at {} ({} of {}): requested {} more (generation request {})",
                certificationTitle, Math.round(use.share() * 100), use.level(), use.seen(), use.pool(),
                count, row.getGenerationRequestId());
    }
}
