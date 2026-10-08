package com.capstone.rebyu.institution.dto;

import com.capstone.rebyu.enrollment.dto.InstitutionCertificationLearnerDto;
import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.InvitationDto;

import java.util.List;

public final class InstitutionPortalDtos {

    private InstitutionPortalDtos() {
    }

    public record LearnerSummaryDto(Long learnerId, String firstName, String lastName, String username) {}

    public record GroupMembershipDto(Long institutionCertLearnerId, Long departmentId, String departmentName) {}

    public record OverviewDto(
            List<InstitutionCertificateDto> institutionCerts,
            List<InstitutionCertificationLearnerDto> assignments,
            List<LearnerSummaryDto> learners,
            List<InvitationDto> invitations,
            List<GroupMembershipDto> groupMemberships
    ) {}
}
