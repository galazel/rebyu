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

    @GetMapping("/profile")
    public InstitutionDto profile(@AuthenticationPrincipal Jwt jwt) {
        return institutionService.getById(myInstitutionId(jwt));
    }

    @GetMapping("/overview")
    public OverviewDto overview(@AuthenticationPrincipal Jwt jwt) {
        return portalService.overview(myInstitutionId(jwt));
    }

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
                to == null ? null : to.atTime(java.time.LocalTime.MAX));
    }

    @GetMapping("/dashboard")
    public InstitutionDashboardDto dashboard(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.dashboard(myInstitutionId(jwt), from, to);
    }

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

    @GetMapping("/members")
    public List<DepartmentHeadDto> members(@AuthenticationPrincipal Jwt jwt) {
        return departmentHeadService.getByInstitutionId(myInstitutionId(jwt));
    }

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

    @GetMapping("/learners/{learnerId}/exam-results")
    public List<ExamResultDto> learnerExamResults(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long learnerId) {
        return portalService.learnerExamResults(myInstitutionId(jwt), learnerId);
    }

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

    @PostMapping("/invoices/{invoiceId}/checkout")
    public com.capstone.rebyu.billing.service.InstitutionInvoiceService.CheckoutDto invoiceCheckout(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long invoiceId) {
        return invoiceService.startCheckout(myInstitutionId(jwt), invoiceId);
    }

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

    private List<Long> myDepartmentIds(CurrentUserDto user) {
        if ("owner".equalsIgnoreCase(user.departmentHeadRole())) {
            return null;
        }
        return departmentService.getAccessible(user.institutionId(), user.userId(), false, null).stream()
                .map(com.capstone.rebyu.department.dto.DepartmentDto::getDepartmentId)
                .toList();
    }
}
