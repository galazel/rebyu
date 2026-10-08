package com.capstone.rebyu.assessment.repository;

import com.capstone.rebyu.assessment.entity.QuestionRubricCriterion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

import java.util.List;

public interface QuestionRubricCriterionRepository
        extends JpaRepository<QuestionRubricCriterion, Long> {

    List<QuestionRubricCriterion> findByQuestion_QuestionIdOrderByDisplayOrderAsc(Long questionId);

    List<QuestionRubricCriterion> findByQuestion_QuestionIdInOrderByQuestion_QuestionIdAscDisplayOrderAsc(
            Collection<Long> questionIds);
}
