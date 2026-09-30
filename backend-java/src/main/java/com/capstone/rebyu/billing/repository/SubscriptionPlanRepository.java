package com.capstone.rebyu.billing.repository;

import com.capstone.rebyu.billing.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Optional<SubscriptionPlan> findByPlanCode(String planCode);

    List<SubscriptionPlan> findByCustomerTypeAndStatusOrderByDisplayOrderAsc(
            SubscriptionPlan.CustomerType customerType, String status);

    List<SubscriptionPlan> findAllByOrderByDisplayOrderAsc();
}
