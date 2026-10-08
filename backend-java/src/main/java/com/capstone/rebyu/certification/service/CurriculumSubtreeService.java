package com.capstone.rebyu.certification.service;

import com.capstone.rebyu.common.BusinessRuleException;
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

    public void clearFor(Node node, Long id) {
        String lessons = lessonScope(node);
        String exams = examScope(node, lessons);
        String questions = "SELECT question_id FROM questions WHERE lesson_id IN (" + lessons + ")";

        requireNoGradedRecords(node, id, exams);

        entityManager.flush();

        delete("DELETE FROM exam_questions WHERE exam_id IN (" + exams + ")", id);
        delete("DELETE FROM exams WHERE exam_id IN (" + exams + ")", id);

        delete("DELETE FROM programming_test_cases WHERE programming_question_config_id IN ("
                + "SELECT programming_question_config_id FROM programming_question_configs "
                + "WHERE question_id IN (" + questions + "))", id);
        delete("DELETE FROM programming_question_configs WHERE question_id IN (" + questions + ")", id);
        delete("DELETE FROM diagram_question_configs WHERE question_id IN (" + questions + ")", id);
        delete("DELETE FROM text_question_configs WHERE question_id IN (" + questions + ")", id);
        delete("DELETE FROM question_rubric_criteria WHERE question_id IN (" + questions + ")", id);
        delete("DELETE FROM learner_mistake_reviews WHERE source_question_id IN (" + questions + ")", id);
        delete("DELETE FROM learner_review_items WHERE source_question_id IN (" + questions + ")", id);
        delete("DELETE FROM choices WHERE question_id IN (" + questions + ")", id);

        delete("DELETE FROM questions WHERE parent_question_id IN (" + questions + ")", id);
        delete("DELETE FROM questions WHERE question_id IN (" + questions + ")", id);

        delete("DELETE FROM generated_study_sets WHERE lesson_id IN (" + lessons + ")", id);
        delete("DELETE FROM learner_practice_attempts WHERE lesson_id IN (" + lessons + ")", id);
        delete("DELETE FROM learner_read_sections WHERE lesson_id IN (" + lessons + ")", id);
        delete("DELETE FROM learner_library_items WHERE lesson_id IN (" + lessons + ")", id);
        delete("DELETE FROM learner_completed_lessons WHERE lesson_id IN (" + lessons + ")", id);

        delete("DELETE FROM lesson_images WHERE lesson_id IN (" + lessons + ")", id);
        delete("DELETE FROM lesson_videos WHERE lesson_id IN (" + lessons + ")", id);

        entityManager.clear();

        log.info("Cleared content under {} id={}", node.label(), id);
    }

    private void requireNoGradedRecords(Node node, Long id, String exams) {
        refuseIfAny(
                "SELECT count(*) FROM assessment_attempts WHERE exam_id IN (" + exams + ")",
                id, node, "assessment attempt");
        refuseIfAny(
                "SELECT count(*) FROM exam_results WHERE exam_id IN (" + exams + ")",
                id, node, "recorded exam result");
    }

    private void refuseIfAny(String countSql, Long id, Node node, String what) {
        Number count = (Number) entityManager.createNativeQuery(countSql)
                .setParameter("nodeId", id)
                .getSingleResult();

        if (count == null || count.longValue() == 0) {
            return;
        }

        throw new BusinessRuleException.CurriculumNodeInUseException(
                "This %s cannot be deleted: it has %d %s%s from learners. Deleting it would remove their records."
                        .formatted(node.label(), count.longValue(), what, count.longValue() == 1 ? "" : "s"));
    }

    private String lessonScope(Node node) {
        return switch (node) {
            case LESSON -> "SELECT lesson_id FROM lessons WHERE lesson_id = :nodeId";
            case MIDDLE -> "SELECT lesson_id FROM lessons WHERE middle_category_id = :nodeId";
            case MAJOR -> "SELECT lesson_id FROM lessons WHERE middle_category_id IN ("
                    + "SELECT middle_category_id FROM middle_categories WHERE major_category_id = :nodeId)";
        };
    }

    private String examScope(Node node, String lessons) {
        return switch (node) {
            case LESSON -> "SELECT exam_id FROM exams WHERE lesson_id = :nodeId";
            case MIDDLE -> "SELECT exam_id FROM exams WHERE middle_category_id = :nodeId"
                    + " OR lesson_id IN (" + lessons + ")";
            case MAJOR -> "SELECT exam_id FROM exams WHERE major_category_id = :nodeId"
                    + " OR middle_category_id IN ("
                    + "SELECT middle_category_id FROM middle_categories WHERE major_category_id = :nodeId)"
                    + " OR lesson_id IN (" + lessons + ")";
        };
    }

    private void delete(String sql, Long id) {
        entityManager.createNativeQuery(sql).setParameter("nodeId", id).executeUpdate();
    }
}
