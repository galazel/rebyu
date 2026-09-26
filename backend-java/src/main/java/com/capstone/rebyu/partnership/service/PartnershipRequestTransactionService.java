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

/**
 * Transaction Three: institution partnership request submission.
 *
 * The request and all of its certification line items are created in one
 * atomic transaction, so a failure never leaves an orphan request. An
 * idempotency key prevents a double-submit from creating two requests.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PartnershipRequestTransactionService {

    private static final String ADMIN_USER_TYPE = "ADMIN";

    private final PartnershipRequestRepository requestRepository;
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

        LocalDateTime now = LocalDateTime.now();
        PartnershipRequest partnershipRequest = PartnershipRequest.builder()
                .institution(institution)
                /* The request carries its own copy of who sent it, exactly as a
                   public request does. Nothing downstream reads through to the
                   linked institution: the admin list, the review dialog and --
                   the expensive one -- the approval email all read these fields
                   off the request. Leaving them null is why a request raised
                   from the portal showed a blank row, and why its approval mail
                   was addressed to nobody and silently never sent.

                   A copy rather than a join, because it is a record of what was
                   asked for and by whom at the time; renaming the institution
                   later must not rewrite the history of its requests. */
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
            // Only published certifications can be inquired about -- drafts are
            // still being built (see the CertificationService publish gate).
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

    /** Unknown or absent reads as NEW rather than failing the submission. */
    private static PartnershipRequest.RequestType parseType(String requested) {
        if (requested == null || requested.isBlank()) return PartnershipRequest.RequestType.NEW;
        try {
            return PartnershipRequest.RequestType.valueOf(
                    requested.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return PartnershipRequest.RequestType.NEW;
        }
    }

    /** {PREFIX}-XXXXXXXX, unique -- the prefix says what kind of request it is. */
    private String generateReferenceNumber(PartnershipRequest.RequestType type) {
        String candidate;
        do {
            candidate = type.prefix() + "-" + java.util.UUID.randomUUID().toString()
                    .substring(0, 8).toUpperCase(java.util.Locale.ROOT);
        } while (requestRepository.findByReferenceNumber(candidate).isPresent());
        return candidate;
    }

    /**
     * Asks to end the partnership. No line items: it is not a request for
     * anything, it is a request to stop everything, and which certifications
     * that covers is whatever the institution holds on the day an admin
     * approves it -- not the day it asked.
     *
     * <p>One open cancellation at a time. A second would be approved twice and
     * refund twice.
     */
    @Transactional
    public PartnershipRequestTransactionDto submitCancellation(Long institutionId, String reason) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new EntityNotFoundException("Institution not found: " + institutionId));

        boolean alreadyAsked = requestRepository
                .findByInstitution_InstitutionIdOrderBySubmittedAtDesc(institutionId).stream()
                .anyMatch(request -> request.getRequestType() == PartnershipRequest.RequestType.CANCELLATION
                        && (request.getStatus() == PartnershipRequest.Status.PENDING
                                || request.getStatus() == PartnershipRequest.Status.UNDER_REVIEW));
        if (alreadyAsked) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "A cancellation request is already waiting for review.");
        }

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
                itemDtos
        );
    }
}
