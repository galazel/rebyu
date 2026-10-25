package com.capstone.rebyu.learningtools.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Saves what the AI tutor drew in a chat -- a practice quiz, a flashcard set or
 * a mind map -- to the learner's Library, so it can be reopened later.
 *
 * Quizzes become practice exams and flashcards become study sets, exactly like
 * the ones the old "Generate" buttons made; a mind map is a Library item that
 * carries the map itself. No AI is called here, so nothing is metered: the chat
 * message that produced the widget was already counted.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TutorLibraryService {

    private final GeneratedAssessmentService generatedAssessmentService;
    private final StudyPracticeService studyPracticeService;
    private final LearnerToolsService learnerToolsService;
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public record Saved(Long id, String title, String route) {}

    public static boolean isSaveable(String widgetType) {
        return List.of("quiz", "flashcards", "mindmap", "matching", "ordering", "fill_blank", "true_false",
                "sorting", "word_game", "puzzle", "visual_game", "speed_flashcards", "branching_story", "simulation", "two_truths_lie").contains(widgetType);
    }

    /** Saves one widget; null when it cannot be (no lesson, malformed). */
    @Transactional
    public Saved save(Long learnerId, Long lessonId, String lessonName, JsonNode widget) {
        if (learnerId == null || lessonId == null || widget == null) return null;
        String lesson = lessonName == null || lessonName.isBlank() ? "this lesson" : lessonName.trim();
        try {
            Saved saved = switch (widget.path("type").asText()) {
                case "quiz" -> saveQuiz(learnerId, lessonId, lesson, widget);
                case "flashcards" -> saveFlashcards(learnerId, lessonId, lesson, widget);
                case "mindmap" -> saveMindMap(learnerId, lessonId, lesson, widget);
                default -> isSaveable(widget.path("type").asText()) ? saveActivity(learnerId, lessonId, lesson, widget) : null;
            };
            if (saved == null) return null;
            // Keep the original widget, not just its title or a chat link. Both study modes reopen identically.
            if (!"mindmap".equals(widget.path("type").asText())) {
                String route = "/learner/activities/" + saved.id();
                jdbc.update("UPDATE learner_library_items SET resource_url = ?, content = ? WHERE library_item_id = ? AND learner_id = ?",
                        route, objectMapper.writeValueAsString(widget), saved.id(), learnerId);
                return new Saved(saved.id(), saved.title(), route);
            }
            return saved;
        } catch (Exception e) {
            log.warn("Could not save a tutor {} to learner {}'s Library: {}",
                    widget.path("type").asText(), learnerId, e.toString());
            throw new IllegalStateException("The activity could not be saved to Library", e);
        }
    }

    private Saved saveActivity(Long learnerId, Long lessonId, String lesson, JsonNode widget) {
        Long certificationId = jdbc.query("""
                SELECT ma.certification_id FROM lessons l
                JOIN middle_categories mi ON mi.middle_category_id = l.middle_category_id
                JOIN major_categories ma ON ma.major_category_id = mi.major_category_id
                WHERE l.lesson_id = ?
                """, rs -> rs.next() ? (Long) rs.getObject(1) : null, lessonId);
        var item = learnerToolsService.createLibraryItem(learnerId, new LearnerToolsService.LibraryRequest(
                "activity", title(widget.path("title").asText(""), widget.path("type").asText().replace('_', ' '), lesson),
                "Interactive learning activity made by the AI tutor in " + lesson + ".", null, certificationId, lessonId));
        return new Saved(item.id(), item.title(), item.route());
    }

    /** Only the owning learner can retrieve playable content, including its answers. */
    public Map<String, Object> activity(Long learnerId, Long libraryItemId) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT i.title, i.content, i.lesson_id, l.name lesson_title
                FROM learner_library_items i LEFT JOIN lessons l ON l.lesson_id = i.lesson_id
                WHERE i.library_item_id = ? AND i.learner_id = ? AND i.item_type IN ('quiz','flashcard','activity')
                """, libraryItemId, learnerId);
        if (rows.isEmpty() || rows.get(0).get("content") == null) throw new IllegalArgumentException("Activity not found");
        Map<String, Object> row = rows.get(0);
        return Map.of("title", row.get("title"), "lessonId", row.get("lesson_id") == null ? "" : row.get("lesson_id"),
                "lessonTitle", row.get("lesson_title") == null ? "" : row.get("lesson_title"),
                "widget", objectMapper.readValue((String) row.get("content"), Map.class));
    }

    private Saved saveQuiz(Long learnerId, Long lessonId, String lesson, JsonNode widget) {
        List<GeneratedAssessmentService.GeneratedQuestionItem> items = new ArrayList<>();
        for (JsonNode q : widget.path("questions")) {
            List<String> choices = new ArrayList<>();
            q.path("options").forEach(o -> choices.add(o.asText()));
            int correct = q.path("correctIndex").asInt(-1);
            if (correct < 0 || correct >= choices.size()) continue;
            items.add(new GeneratedAssessmentService.GeneratedQuestionItem(
                    q.path("question").asText(), choices, choices.get(correct), null,
                    q.path("explanation").asText(null), "AVERAGE"));
        }
        if (items.isEmpty()) return null;
        String title = title(widget.path("title").asText(""), "Practice Quiz", lesson);
        var exam = generatedAssessmentService.createGeneratedExam(learnerId, "quiz", title, lessonId, items);
        var item = learnerToolsService.createLibraryItem(learnerId, new LearnerToolsService.LibraryRequest(
                "quiz", exam.title(), "Made by the AI tutor in " + lesson + ". Open it to begin an attempt.",
                "/learner/assessments/" + exam.examId(), exam.certificationId(), lessonId));
        return new Saved(item.id(), item.title(), item.route());
    }

    private Saved saveFlashcards(Long learnerId, Long lessonId, String lesson, JsonNode widget) {
        List<StudyPracticeService.GeneratedItem> items = new ArrayList<>();
        for (JsonNode card : widget.path("cards")) {
            items.add(new StudyPracticeService.GeneratedItem("FLASHCARD", card.path("front").asText(), null,
                    card.path("back").asText(), null, null, "AVERAGE"));
        }
        if (items.isEmpty()) return null;
        String title = title(widget.path("title").asText(""), "Flashcards", lesson);
        var set = studyPracticeService.createGeneratedStudySet(learnerId, "FLASHCARD", title, lessonId, items);
        var item = learnerToolsService.createLibraryItem(learnerId, new LearnerToolsService.LibraryRequest(
                "flashcard", set.title(), "Made by the AI tutor in " + lesson + ". Open it to begin studying.",
                "/learner/flashcards/" + set.id(), set.certificationId(), lessonId));
        return new Saved(item.id(), item.title(), item.route());
    }

    private Saved saveMindMap(Long learnerId, Long lessonId, String lesson, JsonNode widget) throws Exception {
        String center = widget.path("center").asText("");
        if (center.isBlank() || !widget.path("branches").isArray()) return null;
        Long certificationId = jdbc.query(
                """
                SELECT ma.certification_id FROM lessons l
                JOIN middle_categories mi ON mi.middle_category_id = l.middle_category_id
                JOIN major_categories ma ON ma.major_category_id = mi.major_category_id
                WHERE l.lesson_id = ?
                """,
                rs -> rs.next() ? (Long) rs.getObject(1) : null, lessonId);
        var item = learnerToolsService.createLibraryItem(learnerId, new LearnerToolsService.LibraryRequest(
                "mindmap", title(center, "Mind map", lesson), "Mind map made by the AI tutor in " + lesson + ".",
                null, certificationId, lessonId));
        String route = "/learner/mind-maps/" + item.id();
        jdbc.update("UPDATE learner_library_items SET resource_url = ?, content = ? WHERE library_item_id = ?",
                route, objectMapper.writeValueAsString(widget), item.id());
        return new Saved(item.id(), item.title(), route);
    }

    /** The saved mind map, only for its owner. */
    public Map<String, Object> mindMap(Long learnerId, Long libraryItemId) throws Exception {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT i.title, i.content, i.lesson_id, l.name lesson_title
                FROM learner_library_items i LEFT JOIN lessons l ON l.lesson_id = i.lesson_id
                WHERE i.library_item_id = ? AND i.learner_id = ? AND i.item_type = 'mindmap'
                """, libraryItemId, learnerId);
        if (rows.isEmpty() || rows.get(0).get("content") == null) {
            throw new IllegalArgumentException("Mind map not found");
        }
        Map<String, Object> row = rows.get(0);
        return Map.of(
                "title", row.get("title"),
                "lessonId", row.get("lesson_id") == null ? "" : row.get("lesson_id"),
                "lessonTitle", row.get("lesson_title") == null ? "" : row.get("lesson_title"),
                // A plain Map, not a JsonNode: responses are written by Spring's own
                // (Jackson 3) mapper, which would serialise a Jackson 2 node as a bean.
                "widget", objectMapper.readValue((String) row.get("content"), Map.class));
    }

    private static String title(String given, String kind, String lesson) {
        String base = given == null || given.isBlank() ? kind + ": " + lesson
                : given.toLowerCase().contains(kind.toLowerCase()) ? given : kind + ": " + given;
        return base.length() > 170 ? base.substring(0, 170) : base;
    }
}
