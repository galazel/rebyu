package com.capstone.rebyu.adaptive.repository;

import com.capstone.rebyu.adaptive.entity.QuestionItemParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface QuestionItemParameterRepository extends JpaRepository<QuestionItemParameter, Long> {

    /** One statement, insert or update -- the online learner writes after every response. */
    @Modifying
    @Query(value = """
            INSERT INTO question_item_parameters
                (question_id, discrimination, difficulty, guessing, response_count, source, updated_at)
            VALUES (:questionId, :a, :b, :c, :responseCount, :source, :updatedAt)
            ON CONFLICT (question_id) DO UPDATE SET
                difficulty = EXCLUDED.difficulty,
                response_count = EXCLUDED.response_count,
                updated_at = EXCLUDED.updated_at
            """, nativeQuery = true)
    void upsert(@Param("questionId") Long questionId, @Param("a") double a, @Param("b") double b,
                @Param("c") double c, @Param("responseCount") int responseCount,
                @Param("source") String source, @Param("updatedAt") LocalDateTime updatedAt);
}
