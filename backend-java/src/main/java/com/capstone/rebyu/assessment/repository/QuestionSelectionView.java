package com.capstone.rebyu.assessment.repository;

public interface QuestionSelectionView {

    Long getQuestionId();

    Long getLessonId();

    String getDifficultyLevel();

    String getQuestionText();

    Long getOwnerDepartmentId();

    String getQuestionType();

}
