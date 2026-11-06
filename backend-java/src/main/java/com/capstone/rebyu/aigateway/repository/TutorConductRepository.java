package com.capstone.rebyu.aigateway.repository;

import com.capstone.rebyu.aigateway.entity.TutorConduct;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TutorConductRepository extends JpaRepository<TutorConduct, Long> {

    /** Row-locked, so two messages sent at once cannot both read the same strike count. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from TutorConduct c where c.learnerId = :learnerId")
    Optional<TutorConduct> findForUpdate(@Param("learnerId") Long learnerId);
}
