package com.capstone.rebyu.adaptive.service;

import com.capstone.rebyu.adaptive.config.AdaptiveProperties;
import com.capstone.rebyu.adaptive.engine.BktModel;
import com.capstone.rebyu.bkt.config.BktProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A lesson's BKT parameters: the trained ones from the model service when it
 * has them, the configured defaults otherwise. Cached for a few minutes so a
 * sixty-item mock exam does not ask the service sixty times.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BktParameterProvider {

    private record Cached(BktModel.Params params, Instant fetchedAt) {
    }

    private final AdaptiveProperties properties;
    private final BktProperties bktProperties;
    private final Map<Long, Cached> cache = new ConcurrentHashMap<>();

    public BktModel.Params defaults() {
        return new BktModel.Params(
                properties.getDefaultPrior(), properties.getDefaultLearn(),
                properties.getDefaultGuess(), properties.getDefaultSlip());
    }

    public BktModel.Params forLesson(Long lessonId) {
        if (lessonId == null || !bktProperties.isEnabled()) {
            return defaults();
        }
        Cached cached = cache.get(lessonId);
        Duration ttl = Duration.ofMinutes(Math.max(1, properties.getBktParamsCacheMinutes()));
        if (cached != null && cached.fetchedAt().plus(ttl).isAfter(Instant.now())) {
            return cached.params();
        }
        BktModel.Params params = defaults();
        cache.put(lessonId, new Cached(params, Instant.now()));
        return params;
    }
}
