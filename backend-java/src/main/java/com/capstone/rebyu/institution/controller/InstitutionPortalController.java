package com.capstone.rebyu.institution.controller;

import com.capstone.rebyu.assessment.dto.ExamResultDto;
import com.capstone.rebyu.enrollment.service.CertificationAwardService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.institution.service.DepartmentHeadProvisioningService;
import com.capstone.rebyu.institution.service.DepartmentHeadProvisioningService.InviteResult;
import com.capstone.rebyu.institution.service.InstitutionDashboardService;
import com.capstone.rebyu.institution.service.InstitutionDashboardService.InstitutionDashboardDto;
import com.capstone.rebyu.institution.service.InstitutionLearningStatsService;
import com.capstone.rebyu.institution.service.InstitutionPortalService;
import com.capstone.rebyu.institution.dto.DepartmentHeadInviteRequestDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.InstitutionLearningStatsDto;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.DepartmentProgressDto;
import com.capstone.rebyu.institution.dto.InstitutionPortalDtos.OverviewDto;
import com.capstone.rebyu.institution.dto.InstitutionDto;
import com.capstone.rebyu.institution.dto.DepartmentHeadDto;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.institution.service.DepartmentHeadService;
import com.capstone.rebyu.institution.service.InstitutionService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Tenant-scoped institution portal reads; institutionId always comes from the caller's JWT. */
@RestController
@RequestMapping("/api/institution/me")
@RequiredArgsConstructor
public class InstitutionPortalController {

    private final InstitutionPortalService portalService;
    private final com.capstone.rebyu.billing.service.InstitutionInvoiceService invoiceService;
    private final InstitutionLearningStatsService learningStatsService;
    private final InstitutionDashboardService dashboardService;
    private final InstitutionService institutionService;
    private final com.capstone.rebyu.department.service.DepartmentService departmentService;
    private final DepartmentHeadService departmentHeadService;
    private final DepartmentHeadProvisioningService departmentHeadProvisioningService;
    private final InstitutionRepository institutionRepository;
    private final CognitoAuthService auth;

    /** The caller's own institution profile (name, contact, address, etc.). */
    @GetMapping("/profile")
    public InstitutionDto profile(@AuthenticationPrincipal Jwt jwt) {
        return institutionService.getById(myInstitutionId(jwt));
    }

    @GetMapping("/overview")
    public OverviewDto overview(@AuthenticationPrincipal Jwt jwt) {
        return portalService.overview(myInstitutionId(jwt));
    }

    /**
     * Learning statistics for the caller: a roster-wide rollup plus a row per
     * member (progress, lessons finished, graded attempts, pass rate, average
     * score, last activity).
     *
     * <p>An owner or administrator gets the whole institution. Anyone else is
     * a department head, and gets only the departments they have been given --
     * their roster, their programmes, their weak topics. The previous version
     * answered with the full institution for every caller and left the browser
     * to filter, which put other departments' learners and marks on the wire
     * for anyone who asked.
     */
    @GetMapping("/learning-stats")
    public InstitutionLearningStatsDto learningStats(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        CurrentUserDto user = institutionUser(jwt);
        return learningStatsService.learningStats(
                user.institutionId(),
                myDepartmentIds(user),
                from == null ? null : from.atStartOfDay(),
                // Inclusive: a request for a single day means that whole day,
                // and `to.atStartOfDay()` would report everything before 00:00
                // as the day's activity -- which is nothing.
                to == null ? null : to.atTime(java.time.LocalTime.MAX));
    }

    /**
     * Everything on the institution dashboard in one consistent snapshot.
     * {@code from}/{@code to} (inclusive dates) bound the activity figures --
     * attempts, lessons, the trend -- and default to the current year.
     */
    @GetMapping("/dashboard")
    public InstitutionDashboardDto dashboard(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.dashboard(myInstitutionId(jwt), from, to);
    }

    /** Completion per learning group, for the group-analytics panels. */
    @GetMapping("/group-stats")
    public List<DepartmentProgressDto> groupStats(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        CurrentUserDto user = institutionUser(jwt);
        return learningStatsService.groupProgress(
                user.institutionId(),
                myDepartmentIds(user),
                to == null ? null : to.atTime(java.time.LocalTime.MAX));
    }

    /** Every member of the caller's own institution (owners, managers, staff). */
    @GetMapping("/members")
    public List<DepartmentHeadDto> members(@AuthenticationPrincipal Jwt jwt) {
        return departmentHeadService.getByInstitutionId(myInstitutionId(jwt));
    }

    /**
     * Creates a brand-new login account for someone the institution wants to
     * manage a group (or otherwise act on the org's behalf) -- e.g. a group
     * leader. A Cognito account is minted and credentials are emailed to them,
     * the same way the institution's own account was created on approval.
     */
    @PostMapping("/members")
    @ResponseStatus(HttpStatus.CREATED)
    public InviteResult inviteMember(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DepartmentHeadInviteRequestDto request) {
        Long institutionId = myInstitutionId(jwt);
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new EntityNotFoundException("Institution not found: " + institutionId));
        return departmentHeadProvisioningService.inviteMember(institution, request);
    }

    /** Exam results for one of the caller's own learners; 404 for learners outside the tenant. */
    @GetMapping("/learners/{learnerId}/exam-results")
    public List<ExamResultDto> learnerExamResults(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long learnerId) {
        return portalService.learnerExamResults(myInstitutionId(jwt), learnerId);
    }

    /** Badges and certificates one of the caller's own learners has earned; 404 outside the tenant. */
    @GetMapping("/learners/{learnerId}/awards")
    public List<CertificationAwardService.AwardDto> learnerAwards(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long learnerId) {
        return portalService.learnerAwards(myInstitutionId(jwt), learnerId);
    }

    @GetMapping("/invoices")
    public java.util.List<com.capstone.rebyu.billing.service.InstitutionInvoiceService.InvoiceDto> invoices(
            @AuthenticationPrincipal Jwt jwt) {
        return invoiceService.listForInstitution(myInstitutionId(jwt));
    }

    /** Opens PayMongo Hosted Checkout for the invoice; the browser is sent to the returned URL. */
    @PostMapping("/invoices/{invoiceId}/checkout")
    public com.capstone.rebyu.billing.service.InstitutionInvoiceService.CheckoutDto invoiceCheckout(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long invoiceId) {
        return invoiceService.startCheckout(myInstitutionId(jwt), invoiceId);
    }

    /** Called from the invoice page after PayMongo redirects back; marks the invoice paid if it is. */
    @PostMapping("/invoices/{invoiceId}/verify")
    public com.capstone.rebyu.billing.service.InstitutionInvoiceService.InvoiceDto invoiceVerify(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long invoiceId) {
        return invoiceService.verifyPayment(myInstitutionId(jwt), invoiceId);
    }

    @GetMapping("/invoices/{invoiceId}")
    public com.capstone.rebyu.billing.service.InstitutionInvoiceService.InvoiceDto invoice(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long invoiceId) {
        return invoiceService.getForInstitution(myInstitutionId(jwt), invoiceId);
    }

    private Long myInstitutionId(Jwt jwt) {
        return institutionUser(jwt).institutionId();
    }

    private CurrentUserDto institutionUser(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        return user;
    }

    /**
     * The departments a caller's analytics are confined to, or null for an
     * owner, who is confined to nothing.
     *
     * <p>Resolved through the same {@code getAccessible} the departments
     * endpoint uses, so "which departments are mine" has exactly one answer in
     * this codebase. A head whose assignments have all been revoked resolves
     * to an empty list, which the stats service reads as "no learners" rather
     * than falling through to the institution.
     */
    private List<Long> myDepartmentIds(CurrentUserDto user) {
        if ("owner".equalsIgnoreCase(user.departmentHeadRole())) {
            return null;
        }
        return departmentService.getAccessible(user.institutionId(), user.userId(), false, null).stream()
                .map(com.capstone.rebyu.department.dto.DepartmentDto::getDepartmentId)
                .toList();
    }
}
