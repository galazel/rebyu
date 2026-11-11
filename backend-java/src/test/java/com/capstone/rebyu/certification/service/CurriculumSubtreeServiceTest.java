package com.capstone.rebyu.certification.service;

import com.capstone.rebyu.common.CascadeDeleteService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InOrder;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Clearing a curriculum node is a full cascade from the node's own table (2026-11-11: learner
 * attempts and results go too). What the cascade reaches -- and in which order -- is checked
 * against the real schema by {@code CascadeDeleteLiveCheckTest}; here, only the contract.
 */
class CurriculumSubtreeServiceTest {

    private final EntityManager entityManager = mock(EntityManager.class);
    private final CascadeDeleteService cascade = mock(CascadeDeleteService.class);
    private CurriculumSubtreeService service;

    @BeforeEach
    void setUp() {
        when(cascade.deleteDependents(anyString(), anyString(), any())).thenReturn(Map.of());
        service = new CurriculumSubtreeService(entityManager, cascade);
    }

    @ParameterizedTest
    @CsvSource({
            "MAJOR,  major_categories,  major_category_id",
            "MIDDLE, middle_categories, middle_category_id",
            "LESSON, lessons,           lesson_id",
    })
    void flushesThenCascadesFromTheNodesTableThenClears(String node, String table, String key) {
        service.clearFor(CurriculumSubtreeService.Node.valueOf(node), 7L);

        InOrder order = inOrder(entityManager, cascade);
        order.verify(entityManager).flush();
        order.verify(cascade).deleteDependents(table, key, List.of(7L));
        order.verify(entityManager).clear();
    }
}
