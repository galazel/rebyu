package com.capstone.rebyu.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class NotificationStreamService {

    private static final long STREAM_TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<Long, Collection<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);

        Collection<SseEmitter> emitters =
                emittersByUser.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> {
            completeQuietly(emitter);
            remove(userId, emitter);
        });
        emitter.onError(error -> {
            completeQuietly(emitter);
            remove(userId, emitter);
        });

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            remove(userId, emitter);
            emitter.completeWithError(e);
            return emitter;
        }

        log.debug("Notification stream opened for userId={} ({} open)", userId, emitters.size());
        return emitter;
    }

    public void push(Long userId, Object payload) {
        Collection<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : emitters) {
            send(userId, emitter, SseEmitter.event().name("notification").data(payload));
        }
    }

    @Scheduled(fixedDelay = 25_000L)
    public void heartbeat() {
        emittersByUser.forEach((userId, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    send(userId, emitter, SseEmitter.event().comment("keep-alive"));
                } catch (Exception e) {
                    log.debug("Heartbeat failed for userId={}; dropping that stream", userId, e);
                    remove(userId, emitter);
                }
            }
        });
    }

    private void send(Long userId, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (Exception e) {
            remove(userId, emitter);
            completeQuietly(emitter);
        }
    }

    private static void completeQuietly(SseEmitter emitter) {
        try {
            emitter.complete();
        } catch (Exception ignored) {
        }
    }

    private void remove(Long userId, SseEmitter emitter) {
        emittersByUser.computeIfPresent(userId, (key, emitters) -> {
            emitters.remove(emitter);
            return emitters.isEmpty() ? null : emitters;
        });
    }
}
