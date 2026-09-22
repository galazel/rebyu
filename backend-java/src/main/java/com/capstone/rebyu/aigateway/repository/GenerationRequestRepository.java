package com.capstone.rebyu.aigateway.repository;

import com.capstone.rebyu.aigateway.entity.GenerationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface GenerationRequestRepository extends JpaRepository<GenerationRequest, Long> {

    /**
     * Whether a bank top-up at this level is already open or recent for the
     * certification: pending, in progress, or finished (either way) since
     * {@code since}. The level is matched inside the request's JSON params.
     */
    @Query("""
            SELECT COUNT(r) > 0 FROM GenerationRequest r
            WHERE r.certificationId = :certificationId
              AND r.requestType = com.capstone.rebyu.aigateway.entity.GenerationRequest.RequestType.QUESTION
              AND r.paramsJson LIKE %:levelMarker%
              AND r.paramsJson LIKE '%"replenish":true%'
              AND (r.status IN (com.capstone.rebyu.aigateway.entity.GenerationRequest.Status.PENDING,
                                com.capstone.rebyu.aigateway.entity.GenerationRequest.Status.PROCESSING)
                   OR r.createdAt >= :since)
            """)
    boolean existsRecentReplenishment(@Param("certificationId") Long certificationId,
                                      @Param("levelMarker") String levelMarker,
                                      @Param("since") LocalDateTime since);
}
