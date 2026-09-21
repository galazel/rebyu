package com.capstone.rebyu.institution.dto;

import com.capstone.rebyu.enrollment.dto.InstitutionCertificationLearnerDto;
import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.InvitationDto;

import java.util.List;

/** Tenant-scoped aggregate for the institution portal — everything resolved from the caller's own institution. */
public final class InstitutionPortalDtos {

    private InstitutionPortalDtos() {
    }

    public record LearnerSummaryDto(Long learnerId, String firstName, String lastName, String username) {}

    /**
     * Which group an assignment sits in, keyed by the assignment row the portal
     * already holds. Kept as its own list rather than a field on the assignment
     * DTO: that DTO is the enrollment record, and group membership belongs to
     * the department package -- folding one into the other would put a
     * grouping concern into the enrollment mapper.
     */
    public record GroupMembershipDto(Long institutionCertLearnerId, Long departmentId, String departmentName) {}

    public record OverviewDto(
            List<InstitutionCertificateDto> institutionCerts,
            List<InstitutionCertificationLearnerDto> assignments,
            List<LearnerSummaryDto> learners,
            List<InvitationDto> invitations,
            List<GroupMembershipDto> groupMemberships
    ) {}
}
