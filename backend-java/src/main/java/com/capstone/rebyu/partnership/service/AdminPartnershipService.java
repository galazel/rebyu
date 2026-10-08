package com.capstone.rebyu.partnership.service;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.UserRepository;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import com.capstone.rebyu.partnership.dto.AdminPartnershipDtos.PartnershipItemDetailDto;
import com.capstone.rebyu.partnership.dto.AdminPartnershipDtos.PartnershipRequestDetailDto;
import com.capstone.rebyu.partnership.dto.AdminPartnershipDtos.PartnershipRequestSummaryDto;
import com.capstone.rebyu.partnership.entity.PartnershipRequest;
import com.capstone.rebyu.partnership.entity.PartnershipRequestItem;
import com.capstone.rebyu.partnership.repository.PartnershipRequestItemRepository;
import com.capstone.rebyu.partnership.repository.PartnershipRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPartnershipService {
    private static final String INSTITUTION_USER_TYPE = "INSTITUTION";

    private final PartnershipRequestRepository requestRepository;
    private final PartnershipRequestItemRepository itemRepository;
    private final InstitutionRepository institutionRepository;
    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final DepartmentHeadRepository departmentHeadRepository;
    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final CognitoAdminService cognitoAdminService;
    private final NotificationService notificationService;
    private final com.capstone.rebyu.billing.service.InstitutionInvoiceService invoiceService;
    private final com.capstone.rebyu.notification.service.EmailService emailService;
    private final InstitutionAccessGrantService accessGrantService;
    private final com.capstone.rebyu.institution.service.InstitutionAccessTeardownService teardownService;

    @Transactional(readOnly = true)
    public List<PartnershipRequestSummaryDto> list(String statusFilter) {
        List<PartnershipRequest> requests = requestRepository.findAllByOrderBySubmittedAtDesc();
        return requests.stream()
                .filter(request -> statusFilter == null || statusFilter.isBlank()
                        || request.getStatus().name().equalsIgnoreCase(statusFilter))
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public PartnershipRequestDetailDto getDetail(Long requestId) {
        return toDetail(loadRequest(requestId));
    }

    @Transactional
    public PartnershipRequestDetailDto approve(Long requestId, String remarks, String reviewedBy) {
        PartnershipRequest request = loadRequest(requestId);
        requireReviewable(request);

        Institution institution = resolveOrCreateInstitution(request);

        if (request.getRequestType() == PartnershipRequest.RequestType.CANCELLATION) {
            return approveCancellation(request, institution, remarks, reviewedBy);
        }

        boolean addsToExistingAccess =
                request.getRequestType() == PartnershipRequest.RequestType.ADDITIONAL
                        || request.getRequestType() == PartnershipRequest.RequestType.RENEWAL
                        || !heldSlots(request).isEmpty();

        accessGrantService.reserve(institution, itemRepository.findByPartnershipRequest_RequestId(requestId));

        request.setInstitution(institution);
        request.setStatus(PartnershipRequest.Status.APPROVED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(reviewedBy);
        request.setAdminRemarks(remarks);
        requestRepository.save(request);

        CognitoAdminService.ProvisionResult provision = provisionInstitutionAccount(institution, request);

        java.util.List<PartnershipRequestItem> billedItems = itemRepository.findByPartnershipRequest_RequestId(requestId);
        com.capstone.rebyu.billing.entity.InstitutionInvoice invoice =
                invoiceService.issueForApprovedRequest(request, institution, billedItems);
        try {
            java.util.List<String> lines = billedItems.stream()
                    .map(item -> item.getCertification().getTitle() + " - " + item.getSlots() + " learner slot(s)"
                            + (item.getRequestedAccessStartDate() != null && item.getRequestedAccessEndDate() != null
                                    ? " (" + item.getRequestedAccessStartDate() + " to " + item.getRequestedAccessEndDate() + ")"
                                    : ""))
                    .toList();
            emailService.sendPartnershipWelcome(
                    addsToExistingAccess,
                    emailOf(request),
                    nameOf(request),
                    referenceOf(request),
                    invoice.getInvoiceNumber(),
                    formatMoney(invoice.getTotalAmount()),
                    "/institution/invoices/" + invoice.getInstitutionInvoiceId(),
                    lines);
        } catch (RuntimeException e) {
            log.warn("Welcome email for request {} could not be sent: {}", referenceOf(request), e.getMessage());
        }

        log.info("Partnership request {} APPROVED (institution {}); account emailed={}",
                referenceOf(request), institution.getInstitutionId(), provision.emailed());

        notifyInstitutionOwners(institution,
                addsToExistingAccess ? "Additional access approved" : "Partnership request approved",
                addsToExistingAccess
                        ? "Your request (" + referenceOf(request) + ") was approved. Pay invoice "
                                + invoice.getInvoiceNumber()
                                + " and the extra slots are added to your allocation."
                        : "Your partnership request (" + referenceOf(request) + ") was approved. "
                                + "Pay invoice " + invoice.getInvoiceNumber() + " to activate access.",
                "/institution/invoices/" + invoice.getInstitutionInvoiceId());

        return toDetail(request, provision.emailed(), provision.note());
    }

    private CognitoAdminService.ProvisionResult provisionInstitutionAccount(
            Institution institution, PartnershipRequest request) {
        boolean alreadyLinked = !departmentHeadRepository
                .findByInstitution_InstitutionId(institution.getInstitutionId()).isEmpty();
        if (alreadyLinked) {
            return new CognitoAdminService.ProvisionResult(false, null,
                    "This institution already has an institution account.");
        }

        String[] name = splitName(contactNameOf(request));
        CognitoAdminService.ProvisionResult result = cognitoAdminService
                .createInstitutionAccount(emailOf(request), name[0], name[1]);

        if (result.cognitoSub() != null || result.emailed()) {
            UserType institutionType = userTypeRepository.findByUserTypeText(INSTITUTION_USER_TYPE)
                    .orElseGet(() -> {
                        UserType type = new UserType();
                        type.setUserTypeText(INSTITUTION_USER_TYPE);
                        return userTypeRepository.save(type);
                    });

            User user = userRepository.findByEmailIgnoreCase(request.getInstitutionEmail())
                    .orElseGet(() -> User.builder()
                            .userType(institutionType)
                            .email(request.getInstitutionEmail())
                            .passwordHash("COGNITO")
                            .accountStatus(User.AccountStatus.active)
                            .joinedAt(LocalDateTime.now())
                            .cognitoSub(result.cognitoSub())
                            .build());
            user.setUserType(institutionType);
            if (user.getCognitoSub() == null && result.cognitoSub() != null) {
                user.setCognitoSub(result.cognitoSub());
            }
            user = userRepository.save(user);

            DepartmentHead member = DepartmentHead.builder()
                    .institution(institution)
                    .user(user)
                    .headRole(DepartmentHead.HeadRole.owner)
                    .isPrimaryContact(true)
                    .joinedAt(LocalDateTime.now())
                    .build();
            departmentHeadRepository.save(member);
        } else {
            User existingUser = userRepository.findByEmailIgnoreCase(request.getInstitutionEmail())
                    .orElse(null);
            if (existingUser != null) {
                DepartmentHead member = DepartmentHead.builder()
                        .institution(institution)
                        .user(existingUser)
                        .headRole(DepartmentHead.HeadRole.owner)
                        .isPrimaryContact(true)
                        .joinedAt(LocalDateTime.now())
                        .build();
                departmentHeadRepository.save(member);
            } else {
                log.warn("Cognito account already exists for {} but no local User is linked to it; "
                                + "institution {} was created with no owner and requires manual linking.",
                        request.getInstitutionEmail(), institution.getInstitutionId());
            }
        }
        return result;
    }

    private static String formatMoney(java.math.BigDecimal amount) {
        return "PHP " + java.text.NumberFormat.getNumberInstance(java.util.Locale.US).format(
                amount == null ? java.math.BigDecimal.ZERO : amount.setScale(2, java.math.RoundingMode.HALF_UP));
    }

    private String[] splitName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return new String[]{"", ""};
        }
        String[] parts = fullName.trim().split("\\s+", 2);
        return new String[]{parts[0], parts.length > 1 ? parts[1] : ""};
    }

    @Transactional
    public PartnershipRequestDetailDto reject(Long requestId, String remarks, String reviewedBy) {
        PartnershipRequest request = loadRequest(requestId);
        requireReviewable(request);

        request.setStatus(PartnershipRequest.Status.REJECTED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(reviewedBy);
        request.setAdminRemarks(remarks);
        requestRepository.save(request);

        log.info("Partnership request {} REJECTED", referenceOf(request));

        if (request.getInstitution() != null) {
            notifyInstitutionOwners(request.getInstitution(),
                    "Partnership request rejected",
                    "Your partnership request (" + referenceOf(request) + ") was not approved."
                            + (remarks == null || remarks.isBlank() ? "" : " Reason: " + remarks),
                    "/institution/partnership");
        }

        String recipient = emailOf(request);
        if (recipient != null) {
            try {
                emailService.sendPartnershipRejected(
                        recipient, nameOf(request), referenceOf(request), remarks);
            } catch (Exception e) {
                log.warn("Rejection email for request {} could not be sent: {}",
                        referenceOf(request), e.getMessage());
            }
        } else {
            log.warn("Request {} rejected with no email address to tell anyone at.",
                    referenceOf(request));
        }

        return toDetail(request);
    }

    private PartnershipRequestDetailDto approveCancellation(
            PartnershipRequest request, Institution institution, String remarks, String reviewedBy) {

        request.setInstitution(institution);
        request.setStatus(PartnershipRequest.Status.APPROVED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(reviewedBy);
        request.setAdminRemarks(remarks);
        requestRepository.save(request);

        var result = teardownService.cancelPartnership(institution.getInstitutionId(),
                "Partnership cancelled (" + referenceOf(request) + ")");
        var refund = result.refund();

        String money = refund.refunded().signum() > 0
                ? formatMoney(refund.refunded()) + " has been refunded to the original payment method."
                : refund.hasPending()
                ? formatMoney(refund.pending()) + " has been sent back to the original payment method "
                        + "and may take a few days to appear."
                : refund.hasExpired()
                        ? formatMoney(refund.expired()) + " is outside the "
                                + com.capstone.rebyu.billing.service.InstitutionRefundService.REFUND_WINDOW_HOURS
                                + "-hour refund window, so it has not been returned."
                        : "There was nothing left to refund.";
        String shortfall = refund.hasFailures()
                ? " " + formatMoney(refund.failed()) + " could not be refunded automatically -- the REBYU team will follow up."
                : "";

        try {
            emailService.sendPartnershipCancelled(
                    emailOf(request), nameOf(request), referenceOf(request), money + shortfall);
        } catch (Exception e) {
            log.warn("Cancellation email for {} could not be sent: {}", referenceOf(request), e.getMessage());
        }

        notifyInstitutionOwners(institution,
                "Partnership cancelled",
                "Your partnership (" + referenceOf(request) + ") has ended and access has been removed. " + money + shortfall,
                "/institution/partnership");

        log.info("Partnership CANCELLED for institution {} ({}): {} refunded, {} failed",
                institution.getInstitutionId(), referenceOf(request), refund.refunded(), refund.failed());

        return toDetail(request);
    }

    private void notifyInstitutionOwners(Institution institution, String title, String body, String href) {
        departmentHeadRepository.findByInstitution_InstitutionId(institution.getInstitutionId()).stream()
                .filter(member -> member.isPrimaryContact() || member.getHeadRole() == DepartmentHead.HeadRole.owner)
                .map(DepartmentHead::getUser)
                .distinct()
                .forEach(user -> notificationService.notify(user, title, body, href));
    }

    private PartnershipRequest loadRequest(Long requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Partnership request not found: " + requestId));
    }

    private void requireReviewable(PartnershipRequest request) {
        if (request.getStatus() != PartnershipRequest.Status.PENDING
                && request.getStatus() != PartnershipRequest.Status.UNDER_REVIEW) {
            throw new BusinessRuleException.InvalidPartnershipRequestException(
                    "This request has already been " + request.getStatus().name().toLowerCase(Locale.ROOT) + ".");
        }
    }

    private Institution resolveOrCreateInstitution(PartnershipRequest request) {
        if (request.getInstitution() != null) {
            return request.getInstitution();
        }
        Institution byEmail = institutionRepository
                .findByPrimaryContactEmailIgnoreCase(request.getInstitutionEmail())
                .orElse(null);
        if (byEmail != null) {
            if (!byEmail.isVerified()) {
                byEmail.setVerified(true);
                institutionRepository.save(byEmail);
            }
            return byEmail;
        }

        String name = request.getInstitutionName();
        if (institutionRepository.findByInstitutionNameIgnoreCase(name).isPresent()) {
            name = name + " (" + request.getReferenceNumber() + ")";
        }

        Institution institution = Institution.builder()
                .institutionName(name)
                .institutionType(Institution.InstitutionType.other)
                .industry("General")
                .primaryContactName(request.getContactPersonName())
                .primaryContactEmail(request.getInstitutionEmail())
                .primaryContactPhone(request.getContactNumber())
                .address(request.getInstitutionAddress())
                .isVerified(true)
                .joinedAt(LocalDateTime.now())
                .build();
        return institutionRepository.save(institution);
    }



    private static String nameOf(PartnershipRequest request) {
        return firstPresent(request.getInstitutionName(),
                request.getInstitution() == null ? null : request.getInstitution().getInstitutionName());
    }

    private static String emailOf(PartnershipRequest request) {
        return firstPresent(request.getInstitutionEmail(),
                request.getInstitution() == null ? null : request.getInstitution().getPrimaryContactEmail());
    }

    private static String contactNameOf(PartnershipRequest request) {
        return firstPresent(request.getContactPersonName(),
                request.getInstitution() == null ? null : request.getInstitution().getPrimaryContactName());
    }

    private static String contactNumberOf(PartnershipRequest request) {
        return firstPresent(request.getContactNumber(),
                request.getInstitution() == null ? null : request.getInstitution().getPrimaryContactPhone());
    }

    private static String addressOf(PartnershipRequest request) {
        return firstPresent(request.getInstitutionAddress(),
                request.getInstitution() == null ? null : request.getInstitution().getAddress());
    }

    private static String referenceOf(PartnershipRequest request) {
        String reference = firstPresent(request.getReferenceNumber(), null);
        return reference != null ? reference : "#" + request.getRequestId();
    }

    private static String typeOf(PartnershipRequest request) {
        return request.getRequestType() == null
                ? PartnershipRequest.RequestType.NEW.name()
                : request.getRequestType().name();
    }

    private static String firstPresent(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) return preferred;
        return fallback != null && !fallback.isBlank() ? fallback : null;
    }

    private Map<Long, Integer> heldSlots(PartnershipRequest request) {
        if (request.getInstitution() == null) return Map.of();
        Map<Long, Integer> held = new java.util.HashMap<>();
        for (InstitutionCertificate allocation : institutionCertificateRepository
                .findByInstitution_InstitutionId(request.getInstitution().getInstitutionId())) {
            held.merge(allocation.getCertification().getCertificationId(),
                    allocation.getTotalSlots() == null ? 0 : allocation.getTotalSlots(),
                    Integer::sum);
        }
        return held;
    }

    private PartnershipRequestSummaryDto toSummary(PartnershipRequest request) {
        List<PartnershipRequestItem> items =
                itemRepository.findByPartnershipRequest_RequestId(request.getRequestId());
        int totalSlots = items.stream()
                .mapToInt(item -> item.getSlots() == null ? 0 : item.getSlots())
                .sum();
        return new PartnershipRequestSummaryDto(
                request.getRequestId(),
                referenceOf(request),
                typeOf(request),
                nameOf(request),
                emailOf(request),
                request.getStatus().name(),
                request.getSubmittedAt(),
                items.size(),
                totalSlots
        );
    }

    private PartnershipRequestDetailDto toDetail(PartnershipRequest request) {
        return toDetail(request, null, null);
    }

    private PartnershipRequestDetailDto toDetail(
            PartnershipRequest request, Boolean accountEmailed, String accountNote) {
        Map<Long, Integer> held = heldSlots(request);
        List<PartnershipItemDetailDto> items = itemRepository
                .findByPartnershipRequest_RequestId(request.getRequestId())
                .stream()
                .map(item -> new PartnershipItemDetailDto(
                        item.getPartnershipRequestItemId(),
                        item.getCertification().getCertificationId(),
                        item.getCertification().getTitle(),
                        item.getSlots(),
                        item.getRequestedAccessStartDate(),
                        item.getRequestedAccessEndDate(),
                        com.capstone.rebyu.billing.service.InstitutionInvoiceService.getPricePerSlot(),
                        com.capstone.rebyu.billing.service.InstitutionInvoiceService.lineTotal(item.getSlots()),
                        held.get(item.getCertification().getCertificationId())))
                .toList();
        java.math.BigDecimal total = items.stream().map(PartnershipItemDetailDto::lineTotal)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        com.capstone.rebyu.billing.service.InstitutionInvoiceService.InvoiceDto invoice =
                invoiceService.findForRequest(request.getRequestId());
        return new PartnershipRequestDetailDto(
                request.getRequestId(),
                referenceOf(request),
                typeOf(request),
                nameOf(request),
                emailOf(request),
                contactNameOf(request),
                contactNumberOf(request),
                addressOf(request),
                request.getBusinessDescription(),
                request.getStatus().name(),
                request.getSubmittedAt(),
                request.getReviewedAt(),
                request.getReviewedBy(),
                request.getAdminRemarks(),
                request.getInstitution() != null ? request.getInstitution().getInstitutionId() : null,
                items,
                accountEmailed,
                accountNote,
                com.capstone.rebyu.billing.service.InstitutionInvoiceService.getPricePerSlot(),
                com.capstone.rebyu.billing.service.InstitutionInvoiceService.CURRENCY,
                total,
                invoice != null ? invoice.institutionInvoiceId() : null,
                invoice != null ? invoice.invoiceNumber() : null,
                invoice != null ? invoice.status() : null
        );
    }
}
