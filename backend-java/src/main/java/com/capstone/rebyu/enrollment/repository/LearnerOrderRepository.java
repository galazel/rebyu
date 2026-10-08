package com.capstone.rebyu.enrollment.repository;

import com.capstone.rebyu.enrollment.entity.LearnerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearnerOrderRepository extends JpaRepository<LearnerOrder, Long> {
    List<LearnerOrder> findByLearner_LearnerId(Long learnerId);

    java.util.Optional<LearnerOrder> findByIdempotencyKey(String idempotencyKey);

    long countByStatus(LearnerOrder.Status status);

    java.util.List<LearnerOrder> findTop8ByStatusOrderByPaidAtDesc(LearnerOrder.Status status);

    @org.springframework.data.jpa.repository.Query("""
            SELECT SUM(o.totalAmount) FROM LearnerOrder o
            WHERE o.status = :status
            """)
    java.math.BigDecimal sumTotalAmountByStatus(
            @org.springframework.data.repository.query.Param("status") LearnerOrder.Status status);

    @org.springframework.data.jpa.repository.Query("""
            SELECT SUM(o.totalAmount) FROM LearnerOrder o
            WHERE o.status = :status AND o.paidAt >= :since
            """)
    java.math.BigDecimal sumTotalAmountByStatusSince(
            @org.springframework.data.repository.query.Param("status") LearnerOrder.Status status,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
