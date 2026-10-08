package com.capstone.rebyu.billing.repository;

import com.capstone.rebyu.billing.entity.LearnerSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearnerSubscriptionRepository extends JpaRepository<LearnerSubscription, Long> {

    List<LearnerSubscription> findByLearner_LearnerIdOrderByCreatedAtDesc(Long learnerId);

    List<LearnerSubscription> findByLearner_LearnerId(Long learnerId);

    Optional<LearnerSubscription> findFirstByLearner_LearnerIdOrderByCreatedAtDesc(Long learnerId);

    Optional<LearnerSubscription> findByProviderSubscriptionId(String providerSubscriptionId);

    List<LearnerSubscription> findAllByOrderByCreatedAtDesc();

    List<LearnerSubscription> findByStatusAndCurrentPeriodEndBefore(
            com.capstone.rebyu.billing.entity.BillingStatus status, java.time.LocalDateTime before);

    long countByStatusIn(java.util.Collection<com.capstone.rebyu.billing.entity.BillingStatus> statuses);
}
