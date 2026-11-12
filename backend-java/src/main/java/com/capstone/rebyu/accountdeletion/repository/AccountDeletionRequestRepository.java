package com.capstone.rebyu.accountdeletion.repository;

import com.capstone.rebyu.accountdeletion.entity.AccountDeletionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountDeletionRequestRepository extends JpaRepository<AccountDeletionRequest, Long> {

    Optional<AccountDeletionRequest> findFirstByUserIdOrderByRequestedAtDesc(Long userId);

    Optional<AccountDeletionRequest> findFirstByUserIdAndStatus(Long userId, AccountDeletionRequest.Status status);

    List<AccountDeletionRequest> findAllByOrderByRequestedAtDesc();

    List<AccountDeletionRequest> findByStatusOrderByRequestedAtAsc(AccountDeletionRequest.Status status);
}
