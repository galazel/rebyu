package com.capstone.rebyu.learningtools.service;

import com.capstone.rebyu.assessment.entity.Choice;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamQuestion;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.entity.Question;
import com.capstone.rebyu.assessment.entity.TextQuestionConfig;
import com.capstone.rebyu.assessment.repository.ExamQuestionRepository;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import com.capstone.rebyu.assessment.repository.QuestionRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GeneratedAssessmentService {

    public static final String QUIZ_EXAM_TYPE = "GENERATED_QUIZ";
    public static final String FLASHCARD_EXAM_TYPE = "GENERATED_FLASHCARD";

    public static final String GENERATED_TARGET_SCOPE = "GENERATED";

    private static final int EXACT_MATCH_MAX_WORDS = 6;

    private final LessonRepository lessons;
    private final ExamTypeRepository examTypes;
    private final ExamRepository exams;
    private final QuestionRepository questions;
    private final ExamQuestionRepository examQuestions;

    public record GeneratedQuestionItem(
            String questionText,
            List<String> choices,
            String correctAnswer,
            String answer,
            String explanation,
            String difficulty) {}

    public record GeneratedExam(Long examId, String title, Long certificationId, int itemCount) {}

    private String titleNotAlreadyUsed(
            String base, Long learnerId, Long lessonId, String examTypeText) {
        return GeneratedTitles.notAlreadyUsed(base, exams
                .findByLearner_LearnerIdAndLesson_LessonIdAndExamType_ExamTypeText(
                        learnerId, lessonId, examTypeText)
                .stream()
                .map(Exam::getTitle)
                .toList());
    }

    @Transactional
    public GeneratedExam createGeneratedExam(
            Long learnerId, String type, String title, Long lessonId, List<GeneratedQuestionItem> items) {
        boolean isQuiz = "quiz".equalsIgnoreCase(type);
        if (!isQuiz && !"flashcard".equalsIgnoreCase(type)) {
            throw new IllegalArgumentException("Unsupported study set type");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("A title is required");
        }
        if (lessonId == null) {
            throw new IllegalArgumentException("A lesson is required to generate an assessment");
        }
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("The generated set has no items");
        }

        Lesson lesson = lessons.findById(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found"));
        Certification certification = lesson.getMiddleCategory().getMajorCategory().getCertification();

        String examTypeText = isQuiz ? QUIZ_EXAM_TYPE : FLASHCARD_EXAM_TYPE;
        ExamType examType = examTypes.findByExamTypeText(examTypeText)
                .orElseThrow(() -> new IllegalStateException(
                        "Exam type '" + examTypeText + "' is not seeded -- see ExamTypeSeeder"));

        Learner learner = Learner.builder().learnerId(learnerId).build();

        String uniqueTitle = titleNotAlreadyUsed(title.trim(), learnerId, lessonId, examTypeText);

        LocalDateTime now = LocalDateTime.now();
        Exam exam = Exam.builder()
                .certification(certification)
                .examType(examType)
                .title(uniqueTitle)
                .isGenerated(true)
                .lesson(lesson)
                .learner(learner)
                .totalQuestions(items.size())
                .passingScore(new BigDecimal("70.00"))
                .status(Exam.Status.PUBLISHED)
                .targetScope(GENERATED_TARGET_SCOPE)
                .publishedAt(now)
                .updatedAt(now)
                .releaseAnswersAfterSubmit(true)
                .build();
        exam = exams.save(exam);

        int displayOrder = 1;
        for (GeneratedQuestionItem item : items) {
            Question question = isQuiz
                    ? buildQuizQuestion(lesson, item)
                    : buildFlashcardQuestion(lesson, item);
            question = questions.save(question);

            examQuestions.save(ExamQuestion.builder()
                    .exam(exam)
                    .question(question)
                    .displayOrder(displayOrder++)
                    .build());
        }

        return new GeneratedExam(exam.getExamId(), exam.getTitle(), certification.getCertificationId(), items.size());
    }

    private Question buildQuizQuestion(Lesson lesson, GeneratedQuestionItem item) {
        validateQuizItem(item);

        Question question = newQuestion(lesson, "MCQ", item);
        List<Choice> choices = new ArrayList<>();
        question.setChoices(choices);
        for (String choiceText : item.choices()) {
            choices.add(Choice.builder()
                    .question(question)
                    .choiceText(choiceText)
                    .correct(choiceText.equals(item.correctAnswer()))
                    .build());
        }
        return question;
    }

    private Question buildFlashcardQuestion(Lesson lesson, GeneratedQuestionItem item) {
        if (item.answer() == null || item.answer().isBlank()) {
            throw new IllegalArgumentException("Every flashcard needs an answer");
        }

        String answer = item.answer().trim();
        boolean exactlyMatchable = answer.split("\\s+").length <= EXACT_MATCH_MAX_WORDS;

        Question question = newQuestion(lesson, "SHORT_ANSWER", item);
        question.setTextQuestionConfig(TextQuestionConfig.builder()
                .question(question)
                .correctAnswer(answer)
                .checkingMethod(exactlyMatchable ? "EXACT_MATCH" : "AI_SEMANTIC")
                .build());
        return question;
    }

    private Question newQuestion(Lesson lesson, String questionType, GeneratedQuestionItem item) {
        if (item.questionText() == null || item.questionText().isBlank()) {
            throw new IllegalArgumentException("Every generated item needs a question");
        }
        String difficulty = normalizeDifficulty(item.difficulty());

        return Question.builder()
                .lesson(lesson)
                .questionType(questionType)
                .difficultyLevel(difficulty)
                .questionText(item.questionText().trim())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void validateQuizItem(GeneratedQuestionItem item) {
        if (item.choices() == null || item.choices().size() < 2) {
            throw new IllegalArgumentException("Each quiz item needs at least two choices");
        }
        if (item.correctAnswer() == null || item.correctAnswer().isBlank()
                || !item.choices().contains(item.correctAnswer())) {
            throw new IllegalArgumentException("Each quiz item needs a correct answer matching one of its choices");
        }
    }

    private static String normalizeDifficulty(String difficulty) {
        String upper = difficulty == null ? "" : difficulty.trim().toUpperCase();
        return List.of("EASY", "AVERAGE", "HARD").contains(upper) ? upper : "AVERAGE";
    }
}
