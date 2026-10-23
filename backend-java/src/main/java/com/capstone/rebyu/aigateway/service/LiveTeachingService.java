package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.LiveTeachingSession;
import com.capstone.rebyu.aigateway.repository.LiveTeachingSessionRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class LiveTeachingService {
    private final LessonRepository lessons;
    private final LiveTeachingSessionRepository sessions;
    private final LearnerEntitlementService entitlements;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    private static final Set<String> STATES = Set.of("INITIALIZING", "GREETING", "DIAGNOSTIC", "TEACHING", "DEMONSTRATING", "ASKING_QUESTION", "LISTENING_FOR_ANSWER", "EVALUATING_ANSWER", "EXPLAINING_FEEDBACK", "TRANSITIONING", "ORAL_EXAM", "LISTENING", "ANSWERING_QUESTION", "WAITING_TO_RESUME", "PAUSED", "COMPLETED", "ERROR");
    private static final Set<String> EVENTS = Set.of("lesson_section_changed", "tab_changed", "text_selected", "image_selected", "tool_opened", "checkpoint");

    @Transactional(readOnly = true)
    public void requireOwner(CurrentUserDto user, UUID id) {
        var session = sessions.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teaching session not found."));
        if (!Objects.equals(session.getUserId(), user.userId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This teaching session belongs to another learner.");
    }

    public Map<String, Object> initialize(CurrentUserDto user, Long lessonId) {
        if (lessonId == null || lessonId <= 0) throw bad("A valid lesson ID is required.");
        // Transaction-scoped lock makes simultaneous starts for this learner/lesson reuse one session.
        jdbc.query("SELECT pg_advisory_xact_lock(?, ?)", (org.springframework.jdbc.core.RowCallbackHandler) row -> {}, user.userId().hashCode(), lessonId.hashCode());
        var lesson = lessons.findById(lessonId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found."));
        Long certificationId = lesson.getMiddleCategory().getMajorCategory().getCertification().getCertificationId();
        if (!"ADMIN".equalsIgnoreCase(user.role())) {
            if (user.learnerId() == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learner access is required.");
            entitlements.requireLearnerEntitlement(user.learnerId(), Entitlements.LESSON_ACCESS, certificationId);
        }
        var session = sessions.findFirstByUserIdAndLessonIdAndStatusNotOrderByUpdatedAtDesc(user.userId(), lessonId, "COMPLETED").orElseGet(() -> {
            var fresh = new LiveTeachingSession();
            fresh.setId(UUID.randomUUID()); fresh.setUserId(user.userId()); fresh.setLessonId(lessonId);
            return sessions.save(fresh);
        });
        var result = new LinkedHashMap<String, Object>();
        result.put("sessionId", session.getId());
        result.put("lessonName", lesson.getName());
        result.put("lessonContent", lesson.getLessonComponentStructure());
        result.put("checkpoint", decode(session.getContextJson()));
        result.put("transcript", decode(session.getTranscriptJson()));
        result.put("status", session.getStatus());
        return result;
    }

    public Map<String, Object> save(CurrentUserDto user, UUID id, String type, String state, Map<String, Object> context, List<Map<String, String>> transcript) {
        var session = sessions.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teaching session not found."));
        if (!Objects.equals(session.getUserId(), user.userId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This teaching session belongs to another learner.");
        if (type == null || state == null || !EVENTS.contains(type) || !STATES.contains(state)) throw bad("Invalid teaching event or state.");
        if ("COMPLETED".equals(session.getStatus()) && !"COMPLETED".equals(state)) throw bad("This teaching session has ended. Start another session.");
        String encodedContext = encode(context == null ? Map.of() : context);
        if (encodedContext.length() > 16000) throw bad("Teaching event is too large.");
        if (transcript != null) {
            if (transcript.size() > 100) throw bad("Transcript is too large.");
            for (var message : transcript) {
                if (message == null || message.get("role") == null || !Set.of("user", "assistant").contains(message.get("role")) || message.get("text") == null || message.get("text").length() > 6000) throw bad("Invalid transcript message.");
            }
            String encodedTranscript = encode(transcript);
            if (encodedTranscript.length() > 150000) throw bad("Transcript is too large.");
            session.setTranscriptJson(encodedTranscript);
        }
        session.setContextJson(encodedContext);
        session.setStatus(state); session.setUpdatedAt(Instant.now());
        sessions.save(session);
        return Map.of("sessionId", id, "status", state);
    }

    private Object decode(String value) {
        try { return json.readValue(value, Object.class); } catch (Exception exception) { throw new IllegalStateException("Invalid teaching checkpoint", exception); }
    }
    private String encode(Object value) {
        try { return json.writeValueAsString(value); } catch (Exception exception) { throw bad("Invalid teaching event payload."); }
    }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
