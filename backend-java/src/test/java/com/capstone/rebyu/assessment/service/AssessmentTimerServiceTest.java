package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.CertificationAssessmentTimers;
import com.capstone.rebyu.assessment.dto.GlobalAssessmentTimers;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.department.entity.Department;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AssessmentTimerServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final CertificationRepository certifications = mock(CertificationRepository.class);
    private final AssessmentTimerService service = new AssessmentTimerService(jdbc, certifications);

    @Test
    void sharedTimersApplyAcrossCertificationsIncludingLegacyTypes() {
        when(jdbc.query(anyString(), ArgumentMatchers.<RowMapper<GlobalAssessmentTimers>>any()))
                .thenReturn(List.of(new GlobalAssessmentTimers(12, 35, 65)));

        assertEquals(12, service.durationMinutes(exam("LESSON_QUIZ", new Certification(), 8)));
        assertEquals(12, service.durationMinutes(exam("QUIZ", new Certification(), 15)));
        assertEquals(35, service.durationMinutes(exam("MODULE_EXAM", new Certification(), null)));
        assertEquals(65, service.durationMinutes(exam("MAJOR_CATEGORY_EXAM", new Certification(), 50)));

        Exam departmentQuiz = exam("LESSON_QUIZ", new Certification(), 22);
        departmentQuiz.setOwnerDepartment(new Department());
        assertEquals(22, service.durationMinutes(departmentQuiz));
    }

    @Test
    void diagnosticAndMockSettingsApplyOnlyWithinTheirCertificationAndCanBeCleared() {
        Certification configured = new Certification();
        Certification other = new Certification();
        when(certifications.findById(4L)).thenReturn(Optional.of(configured));

        service.saveCertification(4L, new CertificationAssessmentTimers(45, 120));
        assertEquals(new CertificationAssessmentTimers(45, 120), service.getCertification(4L));
        assertEquals(45, service.durationMinutes(exam("DIAGNOSTIC_EXAM", configured, 90)));
        assertEquals(120, service.durationMinutes(exam("MOCK_EXAM", configured, null)));
        assertEquals(96, service.durationMinutes(exam("DIAGNOSTIC", other, null)));
        assertEquals(105, service.durationMinutes(exam("MOCK_EXAM", other, 105)));

        service.saveCertification(4L, new CertificationAssessmentTimers(null, null));
        assertEquals(90, service.durationMinutes(exam("DIAGNOSTIC", configured, 90)));
        assertEquals(150, service.durationMinutes(exam("MOCK_EXAM", configured, null)));
    }

    private Exam exam(String type, Certification certification, Integer minutes) {
        return Exam.builder()
                .examType(ExamType.builder().examTypeText(type).build())
                .certification(certification)
                .durationMinutes(minutes)
                .build();
    }
}
