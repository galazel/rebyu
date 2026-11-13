package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.assessment.repository.AssessmentAttemptRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.entity.InstitutionSection;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.entity.LearnerCertification;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationRepository;
import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.MemberLearningStatsDto;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.entity.InstitutionCertificateArchive;
import com.capstone.rebyu.institution.entity.InstitutionLearnerRecord;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.institution.repository.InstitutionLearnerRecordRepository;
import com.capstone.rebyu.user.entity.Learner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InstitutionMembershipServiceTest {

    private final InstitutionCertificationLearnerRepository enrollments = mock(InstitutionCertificationLearnerRepository.class);
    private final DepartmentLearnerRepository departmentLearners = mock(DepartmentLearnerRepository.class);
    private final DepartmentRepository departments = mock(DepartmentRepository.class);
    private final InstitutionCertificateRepository allocations = mock(InstitutionCertificateRepository.class);
    private final LearnerCertificationRepository own = mock(LearnerCertificationRepository.class);
    private final InstitutionLearnerRecordRepository records = mock(InstitutionLearnerRecordRepository.class);
    private final InstitutionLearningStatsService stats = mock(InstitutionLearningStatsService.class);
    private final AssessmentAttemptRepository attempts = mock(AssessmentAttemptRepository.class);

    private final InstitutionMembershipService service = new InstitutionMembershipService(
            mock(SeatLedgerService.class), enrollments, departmentLearners, departments, allocations, own, records, stats, attempts);

    private InstitutionCertificate seatRow;
    private Department department;
    private DepartmentLearner membership;
    private InstitutionCertificationLearner enrollment;

    @BeforeEach
    void setUp() {
        Certification certification = new Certification();
        certification.setCertificationId(3L);
        certification.setTitle("IT Passport Exam");
        seatRow = InstitutionCertificate.builder()
                .institutionCertId(7L).institution(Institution.builder().institutionId(1L).build())
                .certification(certification).totalSlots(22).usedSlots(3).build();
        Learner learner = Learner.builder().learnerId(12L).username("jake").build();
        enrollment = InstitutionCertificationLearner.builder()
                .institutionCertLearnerId(40L).institutionCert(seatRow).learner(learner)
                .assignedAt(LocalDateTime.of(2026, 9, 16, 8, 0)).progressPercentage(BigDecimal.valueOf(36))
                .status(InstitutionCertificationLearner.Status.active).build();
        department = Department.builder().departmentId(1L).departmentName("CCS").usedSlots(3).build();
        membership = DepartmentLearner.builder().departmentLearnerId(5L).department(department)
                .institutionCertLearner(enrollment).status(DepartmentLearner.Status.active)
                .section(InstitutionSection.builder().sectionName("BSCS-3A").build()).build();

        when(departmentLearners.findByInstitutionCertLearner_InstitutionCertLearnerIdIn(anyCollection()))
                .thenReturn(List.of(membership));
        when(stats.memberStats(any(), any())).thenReturn(Map.of(12L, new MemberLearningStatsDto(
                12L, "Jake Galagar", "jake", 1, 1, 0, BigDecimal.valueOf(36), 10, 4, 1, 25, 30,
                LocalDateTime.of(2026, 10, 1, 9, 0))));
        when(attempts.passedMockExamsByLearnerIds(anyCollection(), anyLong())).thenReturn(List.of());
        when(own.findFirstByLearner_LearnerIdAndCertification_CertificationIdAndStatus(12L, 3L, LearnerCertification.Status.active))
                .thenReturn(Optional.empty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void removalFreezesTheRecordAndKeepsTheirOwnEnrolment() {
        LocalDateTime when = LocalDateTime.of(2026, 11, 6, 3, 0);
        int released = service.release(List.of(enrollment), InstitutionLearnerRecord.Reason.removed, null, when);

        assertThat(released).isEqualTo(1);
        assertThat(membership.getStatus()).isEqualTo(DepartmentLearner.Status.archived);
        assertThat(membership.getRemovedAt()).isEqualTo(when);
        assertThat(enrollment.getStatus()).isEqualTo(InstitutionCertificationLearner.Status.revoked);
        assertThat(department.getUsedSlots()).isEqualTo(2);
        assertThat(seatRow.getUsedSlots()).isEqualTo(2);
        verify(own).save(any(LearnerCertification.class));

        ArgumentCaptor<List<InstitutionLearnerRecord>> saved = ArgumentCaptor.forClass(List.class);
        verify(records).saveAll(saved.capture());
        InstitutionLearnerRecord record = saved.getValue().get(0);
        assertThat(record.getLearnerName()).isEqualTo("Jake Galagar");
        assertThat(record.getSectionName()).isEqualTo("BSCS-3A");
        assertThat(record.getDepartmentName()).isEqualTo("CCS");
        assertThat(record.getLeftAt()).isEqualTo(when);
        assertThat(record.getReason()).isEqualTo(InstitutionLearnerRecord.Reason.removed);
        assertThat(record.getAverageScore()).isEqualTo(30);
        assertThat(record.getArchiveId()).isNull();
    }

    @Test
    @SuppressWarnings("unchecked")
    void expiryLeavesSeatCountsToTheArchiveAndLinksTheRecord() {
        InstitutionCertificateArchive archive = InstitutionCertificateArchive.builder().archiveId(9L).build();
        service.release(List.of(enrollment), InstitutionLearnerRecord.Reason.expired, archive, LocalDateTime.now());

        assertThat(seatRow.getUsedSlots()).isEqualTo(3);
        verify(allocations, never()).save(eq(seatRow));
        ArgumentCaptor<List<InstitutionLearnerRecord>> saved = ArgumentCaptor.forClass(List.class);
        verify(records).saveAll(saved.capture());
        assertThat(saved.getValue().get(0).getArchiveId()).isEqualTo(9L);
        assertThat(saved.getValue().get(0).getReason()).isEqualTo(InstitutionLearnerRecord.Reason.expired);
    }

    @Test
    void alreadyRevokedEnrolmentsAreLeftAlone() {
        enrollment.setStatus(InstitutionCertificationLearner.Status.revoked);
        assertThat(service.release(List.of(enrollment), InstitutionLearnerRecord.Reason.removed, null, LocalDateTime.now())).isZero();
        verify(records, never()).saveAll(any());
    }
}
