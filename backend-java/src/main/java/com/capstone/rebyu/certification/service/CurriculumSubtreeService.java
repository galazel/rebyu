package com.capstone.rebyu.certification.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CurriculumSubtreeService {

    public enum Node {
        MAJOR("major category"),
        MIDDLE("module"),
        LESSON("lesson");

        private final String label;

        Node(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    private final EntityManager entityManager;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;

    /**
     * Removes everything under a curriculum node, so the caller can delete the node itself:
     * lessons, their exams with every learner attempt and result, questions, learner progress,
     * and the id-only references (dialogue sessions, skill states, lesson media). The user chose
     * a full cascade on 2026-11-11 -- this used to refuse when learners had graded records.
     */
    public void clearFor(Node node, Long id) {
        entityManager.flush();
        String table = switch (node) {
            case MAJOR -> "major_categories";
            case MIDDLE -> "middle_categories";
            case LESSON -> "lessons";
        };
        String key = switch (node) {
            case MAJOR -> "major_category_id";
            case MIDDLE -> "middle_category_id";
            case LESSON -> "lesson_id";
        };
        var removed = cascade.deleteDependents(table, key, java.util.List.of(id));
        entityManager.clear();
        log.info("Cleared content under {} id={}: {}", node.label(), id, removed);
    }

}
