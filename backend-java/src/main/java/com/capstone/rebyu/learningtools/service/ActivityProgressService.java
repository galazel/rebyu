package com.capstone.rebyu.learningtools.service;

import com.capstone.rebyu.learningtools.entity.LearnerActivityProgress;
import com.capstone.rebyu.learningtools.repository.LearnerActivityProgressRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/** Saves and returns a learner's progress in tutor games, keyed as the page keys it. */
@Service
@RequiredArgsConstructor
public class ActivityProgressService {

    static final String KEY_PREFIX = "rebyu:tutor-progress:";
    private static final int MAX_KEY_LENGTH = 255;
    private static final int MAX_STATE_CHARS = 200_000;

    private final LearnerActivityProgressRepository repository;
    private final ObjectMapper objectMapper;

    /** Every saved game under `prefix` (one Library item, or one tutor chat). */
    @Transactional(readOnly = true)
    public Map<String, Object> list(Long learnerId, String prefix) throws Exception {
        requireKey(prefix);
        Map<String, Object> result = new LinkedHashMap<>();
        for (LearnerActivityProgress row : repository.findByLearnerIdAndProgressKeyStartingWith(learnerId, prefix)) {
            // A plain Map, not a JsonNode: responses are written by Spring's own
            // (Jackson 3) mapper, which would serialise a Jackson 2 node as a bean.
            result.put(row.getProgressKey(), objectMapper.readValue(row.getState(), Map.class));
        }
        return result;
    }

    @Transactional
    public void save(Long learnerId, String key, JsonNode state) throws Exception {
        requireKey(key);
        if (state == null || !state.isObject()) throw new IllegalArgumentException("Progress must be an object");
        String json = objectMapper.writeValueAsString(state);
        if (json.length() > MAX_STATE_CHARS) throw new IllegalArgumentException("Progress is too large to save");

        LearnerActivityProgress row = repository.findByLearnerIdAndProgressKey(learnerId, key)
                .orElseGet(() -> LearnerActivityProgress.builder().learnerId(learnerId).progressKey(key).build());
        row.setState(json);
        if (state.path("_libraryItemId").canConvertToLong()) row.setLibraryItemId(state.path("_libraryItemId").asLong());
        JsonNode score = state.path("_score");
        if (score.path("total").isInt() && score.path("total").asInt() > 0) {
            row.setScoreRight(Math.max(0, score.path("right").asInt(0)));
            row.setScoreTotal(score.path("total").asInt());
        }
        row.setUpdatedAt(OffsetDateTime.now());
        repository.save(row);
    }

    private static void requireKey(String key) {
        if (key == null || !key.startsWith(KEY_PREFIX) || key.length() > MAX_KEY_LENGTH) {
            throw new IllegalArgumentException("Invalid progress key");
        }
    }
}
