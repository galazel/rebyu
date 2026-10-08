package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.assessment.dto.ExamResultDto;
import com.capstone.rebyu.assessment.mapper.ExamResultMapper;
import com.capstone.rebyu.assessment.repository.ExamResultRepository;
import com.capstone.rebyu.enrollment.dto.InstitutionCertificationLearnerDto;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.mapper.InstitutionCertificationLearnerMapper;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.enrollment.service.CertificationAwardService;
import com.capstone.rebyu.institution.dto.InstitutionPortalDtos.GroupMembershipDto;
import com.capstone.rebyu.institution.dto.InstitutionPortalDtos.LearnerSummaryDto;
import com.capstone.rebyu.institution.dto.InstitutionPortalDtos.OverviewDto;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import jakarta.persistence.EntityNotFoundException;
import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.institution.mapper.InstitutionCertificateMapper;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.partnership.service.InstitutionInvitationService;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstitutionPortalService {

    private final InstitutionCertificateRepository institutionCertRepository;
    private final InstitutionCertificateMapper institutionCertMapper;
    private final InstitutionCertificationLearnerRepository institutionCertLearnerRepository;
    private final InstitutionCertificationLearnerMapper institutionCertLearnerMapper;
    private final LearnerRepository learnerRepository;
    private final InstitutionInvitationService invitationService;
    private final DepartmentLearnerRepository groupAssigneeRepository;
    private final ExamResultRepository examResultRepository;
    private final ExamResultMapper examResultMapper;
    private final CertificationAwardService awardService;
    private final CertificationRepository certificationRepository;

    public OverviewDto overview(Long institutionId) {
        List<InstitutionCertificateDto> institutionCerts =
                institutionCertRepository.findByInstitution_InstitutionId(institutionId).stream()
                        .map(institutionCertMapper::toDto).toList();

        List<InstitutionCertificationLearner> assignmentEntities =
                institutionCertLearnerRepository.findByInstitutionCert_Institution_InstitutionId(institutionId);
        List<InstitutionCertificationLearnerDto> assignments =
                assignmentEntities.stream().map(institutionCertLearnerMapper::toDto).toList();

        Set<Long> learnerIds = assignmentEntities.stream()
                .map(a -> a.getLearner().getLearnerId())
                .collect(Collectors.toSet());
        List<LearnerSummaryDto> learners = learnerIds.isEmpty() ? List.of()
                : learnerRepository.findByLearnerIdIn(learnerIds).stream()
                        .map(l -> new LearnerSummaryDto(l.getLearnerId(), l.getFirstName(), l.getLastName(), l.getUsername()))
                        .toList();


        List<GroupMembershipDto> groupMemberships =
                groupAssigneeRepository.assignmentGroupsByInstitution(institutionId).stream()
                        .map(row -> new GroupMembershipDto(
                                row.getInstitutionCertLearnerId(), row.getDepartmentId(), row.getDepartmentName()))
                        .toList();

        return new OverviewDto(institutionCerts, assignments, learners,
                invitationService.listInvitations(institutionId), groupMemberships);
    }

    public List<ExamResultDto> learnerExamResults(Long institutionId, Long learnerId) {
        requireOwnLearner(institutionId, learnerId);
        return examResultRepository.findByLearner_LearnerId(learnerId).stream()
                .map(examResultMapper::toDto).toList();
    }

    public List<CertificationAwardService.AwardDto> learnerAwards(Long institutionId, Long learnerId) {
        requireOwnLearner(institutionId, learnerId);
        return awardService.awardsOf(learnerId, id -> certificationRepository.findById(id).orElse(null));
    }

    private void requireOwnLearner(Long institutionId, Long learnerId) {
        if (!institutionCertLearnerRepository.existsByLearner_LearnerIdAndInstitutionCert_Institution_InstitutionId(learnerId, institutionId)) {
            throw new EntityNotFoundException("Learner not found in this institution: " + learnerId);
        }
    }
}
