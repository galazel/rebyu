package com.capstone.rebyu.learningtools.service;

import com.capstone.rebyu.learningtools.entity.LearnerActivityProgress;
import com.capstone.rebyu.learningtools.repository.LearnerActivityProgressRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ActivityProgressServiceTest {

    private static final String KEY = "rebyu:tutor-progress:v1:library:43:0:1-2";
    private final ObjectMapper json = new ObjectMapper();
    private LearnerActivityProgressRepository repository;
    private ActivityProgressService service;

    @BeforeEach
    void setUp() {
        repository = mock(LearnerActivityProgressRepository.class);
        service = new ActivityProgressService(repository, json);
        when(repository.findByLearnerIdAndProgressKey(9L, KEY)).thenReturn(Optional.empty());
    }

    @Test
    void save_storesStateAndTheLastScore() throws Exception {
        service.save(9L, KEY, json.readTree("{\"guesses\":{\"0\":\"AB\"},\"_score\":{\"right\":7,\"total\":10}}"));

        verify(repository).save(argThat(row -> row.getLearnerId() == 9L
                && KEY.equals(row.getProgressKey())
                && row.getState().contains("\"guesses\"")
                && row.getScoreRight() == 7 && row.getScoreTotal() == 10));
    }

    @Test
    void save_withoutAScoreLeavesItEmpty() throws Exception {
        service.save(9L, KEY, json.readTree("{\"answers\":{}}"));
        verify(repository).save(argThat(row -> row.getScoreTotal() == null));
    }

    @Test
    void save_rejectsKeysOutsideTutorProgress() {
        assertThrows(IllegalArgumentException.class,
                () -> service.save(9L, "something-else", json.readTree("{}")));
        verify(repository, never()).save(any());
    }

    @Test
    void list_returnsEachSavedGameAsAPlainMap() throws Exception {
        when(repository.findByLearnerIdAndProgressKeyStartingWith(9L, "rebyu:tutor-progress:v1:library:43:"))
                .thenReturn(List.of(LearnerActivityProgress.builder().progressKey(KEY).state("{\"moves\":4}").build()));

        Map<String, Object> saved = service.list(9L, "rebyu:tutor-progress:v1:library:43:");

        assertEquals(Map.of("moves", 4), saved.get(KEY));
        assertNull(saved.get("other"));
    }
}
