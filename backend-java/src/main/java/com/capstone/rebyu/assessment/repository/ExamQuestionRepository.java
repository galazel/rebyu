package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    boolean existsByQuestion_QuestionId(Long questionId);

    List<ExamQuestion> findByExam_ExamIdOrderByDisplayOrderAsc(Long examId);

    long countByExam_ExamId(Long examId);

    @Modifying
    void deleteByExam_ExamId(Long examId);

    @Query("""
            SELECT eq.exam.examId AS examId, eq.question.questionId AS questionId
            FROM ExamQuestion eq
            WHERE eq.exam.examId IN :examIds
            ORDER BY eq.exam.examId ASC, eq.displayOrder ASC
            """)
    List<ExamQuestionIdView> findQuestionIdsByExamIds(@Param("examIds") Collection<Long> examIds);

    interface ExamQuestionIdView {
        Long getExamId();

        Long getQuestionId();
    }
}
