package com.capstone.rebyu.learningtools.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TutorLibraryServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final LearnerToolsService tools = mock(LearnerToolsService.class);
    private final ObjectMapper mapper = new ObjectMapper();
    private final TutorLibraryService service = new TutorLibraryService(mock(GeneratedAssessmentService.class), mock(StudyPracticeService.class), tools, jdbc, mapper);

    @Test void everyRequestedActivityIsSaveable() {
        for (String type : List.of("quiz", "flashcards", "true_false", "ordering", "fill_blank", "sorting", "word_game", "puzzle", "visual_game", "speed_flashcards", "matching", "mindmap", "branching_story", "simulation", "two_truths_lie")) assertTrue(TutorLibraryService.isSaveable(type), type);
        assertFalse(TutorLibraryService.isSaveable("unknown"));
    }

    @Test void gameSavesItsFullContentAndOwnerScopedPlayableRoute() throws Exception {
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<ResultSetExtractor<Long>>any(), eq(246L))).thenReturn(4L);
        when(tools.createLibraryItem(eq(9L), any())).thenReturn(new LearnerToolsService.LibraryItem(42L, "activity", "Word game", "", null, null, 4L, "IT", 246L, "Lesson", "Activity", null, true));
        var widget = mapper.readTree("{\"type\":\"word_game\",\"variant\":\"hangman\",\"title\":\"Vocabulary\",\"words\":[{\"word\":\"COST\",\"clue\":\"An expense\"}]}");
        var saved = service.save(9L, 246L, "Costs", widget);
        assertEquals("/learner/activities/42", saved.route());
        verify(jdbc).update(contains("AND learner_id = ?"), eq(saved.route()), eq(mapper.writeValueAsString(widget)), eq(42L), eq(9L));
    }

    @Test void failureIsNotReportedAsASavedActivity() throws Exception {
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<ResultSetExtractor<Long>>any(), eq(246L))).thenThrow(new IllegalStateException("offline"));
        assertThrows(IllegalStateException.class, () -> service.save(9L, 246L, "Lesson", mapper.readTree("{\"type\":\"sorting\"}")));
    }

    @Test void retrievalRequiresTheOwningLearner() {
        when(jdbc.queryForList(anyString(), eq(42L), eq(10L))).thenReturn(List.of());
        assertThrows(IllegalArgumentException.class, () -> service.activity(10L, 42L));
        verify(jdbc).queryForList(contains("i.learner_id = ?"), eq(42L), eq(10L));
    }

    @Test void storedGameReopensWithoutGeneratingAgain() throws Exception {
        when(jdbc.queryForList(anyString(), eq(42L), eq(9L))).thenReturn(List.of(Map.of("title", "Game", "content", "{\"type\":\"puzzle\",\"labels\":[\"A\"]}", "lesson_id", 246L, "lesson_title", "Lesson")));
        var activity = service.activity(9L, 42L);
        assertEquals("puzzle", ((Map<?, ?>)activity.get("widget")).get("type"));
        verifyNoInteractions(tools);
    }
}
