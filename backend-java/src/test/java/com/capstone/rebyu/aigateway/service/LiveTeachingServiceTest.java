package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.LiveTeachingSession;
import com.capstone.rebyu.aigateway.repository.LiveTeachingSessionRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LiveTeachingServiceTest {
    private final LiveTeachingSessionRepository sessions = mock(LiveTeachingSessionRepository.class);
    private final LiveTeachingService service = new LiveTeachingService(mock(LessonRepository.class), sessions, mock(LearnerEntitlementService.class), new ObjectMapper(), mock(org.springframework.jdbc.core.JdbcTemplate.class));
    private final CurrentUserDto owner = new CurrentUserDto(1L, "", "LEARNER", 9L, null, null, "", "", "", "");

    private LiveTeachingSession session(Long userId) {
        var session = new LiveTeachingSession(); session.setId(UUID.randomUUID()); session.setUserId(userId); session.setLessonId(246L);
        when(sessions.findById(session.getId())).thenReturn(Optional.of(session)); return session;
    }

    @Test void rejectsAnotherLearnersCheckpoint() {
        var session = session(2L);
        var error = assertThrows(ResponseStatusException.class, () -> service.save(owner, session.getId(), "checkpoint", "TEACHING", Map.of(), null));
        assertEquals(403, error.getStatusCode().value()); verify(sessions, never()).save(any());
    }
    @Test void rejectsUnknownOrMissingState() {
        var session = session(1L);
        assertThrows(ResponseStatusException.class, () -> service.save(owner, session.getId(), "checkpoint", "PASSED_EXAM", Map.of(), null));
        assertThrows(ResponseStatusException.class, () -> service.save(owner, session.getId(), null, null, Map.of(), null));
        verify(sessions, never()).save(any());
    }
    @Test void savesPauseAndTranscriptWithoutInventingScores() {
        var session = session(1L);
        service.save(owner, session.getId(), "checkpoint", "PAUSED", Map.of("sectionId", "routing"), List.of(Map.of("role", "assistant", "text", "Routing chooses a path.")));
        assertEquals("PAUSED", session.getStatus()); assertTrue(session.getContextJson().contains("routing")); assertTrue(session.getTranscriptJson().contains("Routing"));
        verify(sessions).save(session);
    }
    @Test void rejectsOversizedContext() {
        var session = session(1L);
        assertThrows(ResponseStatusException.class, () -> service.save(owner, session.getId(), "image_selected", "LISTENING", Map.of("caption", "x".repeat(17000)), null));
        verify(sessions, never()).save(any());
    }
    @Test void completedSessionCannotBeRestartedByEvent() {
        var session = session(1L); session.setStatus("COMPLETED");
        assertThrows(ResponseStatusException.class, () -> service.save(owner, session.getId(), "checkpoint", "TEACHING", Map.of(), null));
    }
    @Test void persistsDiagnosticAndRecitationControllerStates() {
        var session = session(1L);
        service.save(owner, session.getId(), "checkpoint", "DIAGNOSTIC", Map.of("teachingController", Map.of("concept", "contribution", "completedConcepts", List.of())), null);
        assertEquals("DIAGNOSTIC", session.getStatus());
        service.save(owner, session.getId(), "checkpoint", "LISTENING_FOR_ANSWER", Map.of("teachingController", Map.of("questionKey", "contribution-1")), null);
        assertEquals("LISTENING_FOR_ANSWER", session.getStatus());
        service.save(owner, session.getId(), "checkpoint", "ORAL_EXAM", Map.of("teachingController", Map.of("concept", "break-even review")), null);
        assertEquals("ORAL_EXAM", session.getStatus());
    }
}
