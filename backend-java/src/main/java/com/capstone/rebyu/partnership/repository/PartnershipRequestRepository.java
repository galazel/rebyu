package com.capstone.rebyu.partnership.repository;

import com.capstone.rebyu.partnership.entity.PartnershipRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartnershipRequestRepository extends JpaRepository<PartnershipRequest, Long> {

    Optional<PartnershipRequest> findByIdempotencyKey(String idempotencyKey);

    List<PartnershipRequest> findByInstitution_InstitutionIdOrderBySubmittedAtDesc(Long institutionId);

    Optional<PartnershipRequest> findByReferenceNumber(String referenceNumber);

    Optional<PartnershipRequest> findByReferenceNumberAndInstitutionEmailIgnoreCase(
            String referenceNumber, String institutionEmail);

    List<PartnershipRequest> findAllByOrderBySubmittedAtDesc();

    boolean existsByInstitutionEmailIgnoreCaseAndStatus(
            String institutionEmail, PartnershipRequest.Status status);

    long countByStatus(PartnershipRequest.Status status);
}
