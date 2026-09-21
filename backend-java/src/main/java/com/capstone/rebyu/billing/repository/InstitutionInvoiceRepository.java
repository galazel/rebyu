package com.capstone.rebyu.billing.repository;

import com.capstone.rebyu.billing.entity.InstitutionInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstitutionInvoiceRepository extends JpaRepository<InstitutionInvoice, Long> {

    List<InstitutionInvoice> findByInstitution_InstitutionIdOrderByIssuedAtDesc(Long institutionId);

    Optional<InstitutionInvoice> findByInstitutionInvoiceIdAndInstitution_InstitutionId(Long id, Long institutionId);

    Optional<InstitutionInvoice> findFirstByPartnershipRequest_RequestIdOrderByIssuedAtDesc(Long requestId);

    boolean existsByInvoiceNumber(String invoiceNumber);
}
