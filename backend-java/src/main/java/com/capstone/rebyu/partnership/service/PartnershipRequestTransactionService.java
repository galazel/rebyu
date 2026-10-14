package com.capstone.rebyu.partnership.service;

import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.partnership.dto.PartnershipTransactionDtos.PartnershipItemDto;
import com.capstone.rebyu.partnership.dto.PartnershipTransactionDtos.PartnershipItemRequestDto;
import com.capstone.rebyu.partnership.dto.PartnershipTransactionDtos.PartnershipRequestTransactionDto;
import com.capstone.rebyu.partnership.dto.PartnershipTransactionDtos.SubmitPartnershipRequestDto;
import com.capstone.rebyu.partnership.entity.PartnershipRequest;
import com.capstone.rebyu.partnership.entity.PartnershipRequestItem;
import com.capstone.rebyu.partnership.repository.PartnershipRequestItemRepository;
import com.capstone.rebyu.partnership.repository.PartnershipRequestRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnershipRequestTransactionService {

    private static final String ADMIN_USER_TYPE = "ADMIN";

    private static final java.util.Set<PartnershipRequest.Status> OPEN_STATUSES = java.util.EnumSet.of(
            PartnershipRequest.Status.PENDING,
            PartnershipRequest.Status.UNDER_REVIEW,
            PartnershipRequest.Status.MEETING_SCHEDULED);

    private static final int RENEWAL_WINDOW_DAYS = 30;

    private final PartnershipRequestRepository requestRepository;
    private final com.capstone.rebyu.institution.repository.InstitutionCertificateRepository allocationRepository;
    private final com.capstone.rebyu.billing.repository.InstitutionInvoiceRepository invoiceRepository;
    private final PartnershipRequestItemRepository itemRepository;
    private final InstitutionRepository institutionRepository;
    private final CertificationRepository certificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public PartnershipRequestTransactionDto submit(SubmitPartnershipRequestDto request) {
        String idempotencyKey = request.idempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<PartnershipRequest> existing =
                    requestRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return toDto(existing.get());
            }
        }

        if (request.items() == null || request.items().isEmpty()) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "Add at least one certification to your partnership request.");
        }

        Institution institution = institutionRepository.findById(request.institutionId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Institution not found: " + request.institutionId()));

        PartnershipRequest.RequestType requestType = parseType(request.requestType());

        java.util.List<PartnershipRequest> history =
                requestRepository.findByInstitution_InstitutionIdOrderBySubmittedAtDesc(institution.getInstitutionId());
        history.stream()
                .filter(row -> OPEN_STATUSES.contains(row.getStatus()))
                .findFirst()
                .ifPresent(open -> {
                    throw new BusinessRuleException.InvalidPartnershipRequestException(
                            "Request " + open.getReferenceNumber() + " is still being reviewed. "
                                    + "You can send another request once it is approved or rejected.");
                });
        boolean partnered = history.stream()
                .filter(row -> row.getStatus() == PartnershipRequest.Status.APPROVED)
                .findFirst()
                .map(latest -> latest.getRequestType() != PartnershipRequest.RequestType.CANCELLATION)
                .orElse(false);
        if (requestType == PartnershipRequest.RequestType.NEW && partnered) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "Your institution is already a partner. Request more access or renew instead.");
        }
        if ((requestType == PartnershipRequest.RequestType.ADDITIONAL
                || requestType == PartnershipRequest.RequestType.RENEWAL) && !partnered) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "You can add access or renew once your first partnership request is approved.");
        }
        if (requestType == PartnershipRequest.RequestType.RENEWAL) {
            java.time.LocalDate opensBefore = java.time.LocalDate.now().plusDays(RENEWAL_WINDOW_DAYS);
            java.time.LocalDate firstEnd = allocationRepository
                    .findByInstitution_InstitutionId(institution.getInstitutionId()).stream()
                    .map(com.capstone.rebyu.institution.entity.InstitutionCertificate::getAccessExpiryDate)
                    .filter(java.util.Objects::nonNull)
                    .min(java.util.Comparator.naturalOrder())
                    .orElse(null);
            if (firstEnd != null && firstEnd.isAfter(opensBefore)) {
                throw new BusinessRuleException.InvalidPartnershipRequestException(
                        "Renewal opens " + RENEWAL_WINDOW_DAYS + " days before access ends ("
                                + firstEnd.minusDays(RENEWAL_WINDOW_DAYS) + ").");
            }
        }
        invoiceRepository.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institution.getInstitutionId()).stream()
                .filter(invoice -> invoice.getStatus() == com.capstone.rebyu.billing.entity.InstitutionInvoice.Status.issued
                        || invoice.getStatus() == com.capstone.rebyu.billing.entity.InstitutionInvoice.Status.payment_submitted)
                .findFirst()
                .ifPresent(unpaid -> {
                    throw new BusinessRuleException.InvalidPartnershipRequestException(
                            "Pay invoice " + unpaid.getInvoiceNumber() + " before requesting more access or a renewal.");
                });

        LocalDateTime now = LocalDateTime.now();
        PartnershipRequest partnershipRequest = PartnershipRequest.builder()
                .institution(institution)

                .requestType(requestType)
                .referenceNumber(generateReferenceNumber(requestType))
                .institutionName(institution.getInstitutionName())
                .institutionEmail(institution.getPrimaryContactEmail())
                .contactPersonName(institution.getPrimaryContactName())
                .contactNumber(institution.getPrimaryContactPhone())
                .institutionAddress(institution.getAddress())
                .submittedAt(now)
                .status(PartnershipRequest.Status.PENDING)
                .idempotencyKey(idempotencyKey != null && !idempotencyKey.isBlank()
                        ? idempotencyKey
                        : java.util.UUID.randomUUID().toString())
                .build();
        partnershipRequest = requestRepository.save(partnershipRequest);

        for (PartnershipItemRequestDto item : request.items()) {
            if (item.requestedAccessEndDate().isBefore(item.requestedAccessStartDate())) {
                throw new BusinessRuleException.InvalidPartnershipRequestException(
                        "An access end date cannot be before its start date.");
            }
            Certification certification = certificationRepository.findById(item.certificationId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Certification not found: " + item.certificationId()));
            if (certification.getStatus() == Certification.CertificationStatus.COMING_SOON) {
                throw new BusinessRuleException.InvalidPartnershipRequestException(
                        certification.getTitle() + " is coming soon and cannot be requested yet.");
            }
            if (certification.getStatus() != Certification.CertificationStatus.PUBLISHED) {
                throw new BusinessRuleException.InvalidPartnershipRequestException(
                        "A selected certification is not yet available for partnership.");
            }

            PartnershipRequestItem entity = PartnershipRequestItem.builder()
                    .partnershipRequest(partnershipRequest)
                    .certification(certification)
                    .slots(item.slots())
                    .requestedAccessStartDate(item.requestedAccessStartDate())
                    .requestedAccessEndDate(item.requestedAccessEndDate())
                    .build();
            itemRepository.save(entity);
        }

        log.info("Partnership request {} submitted by institution {} with {} item(s)",
                partnershipRequest.getRequestId(), institution.getInstitutionId(),
                request.items().size());

        for (var admin : userRepository.findByUserType_UserTypeText(ADMIN_USER_TYPE)) {
            notificationService.notify(
                    admin,
                    "New partnership request",
                    institution.getInstitutionName() + " submitted a partnership request.",
                    "/admin/partnership-requests");
        }

        return toDto(partnershipRequest);
    }

    private static PartnershipRequest.RequestType parseType(String requested) {
        if (requested == null || requested.isBlank()) return PartnershipRequest.RequestType.NEW;
        try {
            return PartnershipRequest.RequestType.valueOf(
                    requested.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return PartnershipRequest.RequestType.NEW;
        }
    }

    private String generateReferenceNumber(PartnershipRequest.RequestType type) {
        String candidate;
        do {
            candidate = type.prefix() + "-" + java.util.UUID.randomUUID().toString()
                    .substring(0, 8).toUpperCase(java.util.Locale.ROOT);
        } while (requestRepository.findByReferenceNumber(candidate).isPresent());
        return candidate;
    }

    @Transactional
    public PartnershipRequestTransactionDto submitCancellation(Long institutionId, String reason) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new EntityNotFoundException("Institution not found: " + institutionId));

        requestRepository.findByInstitution_InstitutionIdOrderBySubmittedAtDesc(institutionId).stream()
                .filter(open -> OPEN_STATUSES.contains(open.getStatus()))
                .findFirst()
                .ifPresent(open -> {
                    throw new BusinessRuleException.InvalidPartnershipRequestException(
                            open.getRequestType() == PartnershipRequest.RequestType.CANCELLATION
                                    ? "A cancellation request is already waiting for review."
                                    : "Request " + open.getReferenceNumber() + " is still being reviewed. "
                                            + "You can end the partnership once it is approved or rejected.");
                });
        invoiceRepository.findByInstitution_InstitutionIdOrderByIssuedAtDesc(institutionId).stream()
                .filter(invoice -> invoice.getStatus() == com.capstone.rebyu.billing.entity.InstitutionInvoice.Status.issued
                        || invoice.getStatus() == com.capstone.rebyu.billing.entity.InstitutionInvoice.Status.payment_submitted)
                .filter(invoice -> invoice.getIssuedAt() != null
                        && invoice.getIssuedAt().isBefore(LocalDateTime.now().minusHours(24)))
                .findFirst()
                .ifPresent(unpaid -> {
                    throw new BusinessRuleException.InvalidPartnershipRequestException(
                            "Invoice " + unpaid.getInvoiceNumber() + " was issued more than 24 hours ago. "
                                    + "Pay it before ending the partnership.");
                });

        PartnershipRequest request = requestRepository.save(PartnershipRequest.builder()
                .institution(institution)
                .requestType(PartnershipRequest.RequestType.CANCELLATION)
                .referenceNumber(generateReferenceNumber(PartnershipRequest.RequestType.CANCELLATION))
                .institutionName(institution.getInstitutionName())
                .institutionEmail(institution.getPrimaryContactEmail())
                .contactPersonName(institution.getPrimaryContactName())
                .contactNumber(institution.getPrimaryContactPhone())
                .institutionAddress(institution.getAddress())
                .businessDescription(reason)
                .submittedAt(LocalDateTime.now())
                .status(PartnershipRequest.Status.PENDING)
                .idempotencyKey(java.util.UUID.randomUUID().toString())
                .build());

        log.info("Cancellation request {} submitted by institution {}",
                request.getReferenceNumber(), institutionId);

        for (var admin : userRepository.findByUserType_UserTypeText(ADMIN_USER_TYPE)) {
            notificationService.notify(
                    admin,
                    "Partnership cancellation requested",
                    institution.getInstitutionName() + " asked to end its partnership."
                            + (reason == null || reason.isBlank() ? "" : " Reason: " + reason),
                    "/admin/partnership-requests");
        }

        return toDto(request);
    }

    @Transactional(readOnly = true)
    public List<PartnershipRequestTransactionDto> listForInstitution(Long institutionId) {
        return requestRepository
                .findByInstitution_InstitutionIdOrderBySubmittedAtDesc(institutionId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private PartnershipRequestTransactionDto toDto(PartnershipRequest request) {
        List<PartnershipRequestItem> items =
                itemRepository.findByPartnershipRequest_RequestId(request.getRequestId());
        List<PartnershipItemDto> itemDtos = new ArrayList<>();
        int totalSlots = 0;
        for (PartnershipRequestItem item : items) {
            totalSlots += item.getSlots() == null ? 0 : item.getSlots();
            itemDtos.add(new PartnershipItemDto(
                    item.getPartnershipRequestItemId(),
                    item.getCertification().getCertificationId(),
                    item.getCertification().getTitle(),
                    item.getSlots(),
                    item.getRequestedAccessStartDate(),
                    item.getRequestedAccessEndDate()
            ));
        }
        return new PartnershipRequestTransactionDto(
                request.getRequestId(),
                request.getInstitution().getInstitutionId(),
                request.getInstitution().getInstitutionName(),
                request.getStatus().name(),
                request.getSubmittedAt(),
                totalSlots,
                itemDtos,
                request.getRequestType() == null ? null : request.getRequestType().name(),
                request.getReferenceNumber(),
                request.getRequestType() == PartnershipRequest.RequestType.CANCELLATION
                        ? request.getBusinessDescription()
                        : null
        );
    }
}
