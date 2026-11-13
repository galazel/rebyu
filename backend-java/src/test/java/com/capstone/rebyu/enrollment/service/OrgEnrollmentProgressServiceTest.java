package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import com.capstone.rebyu.user.entity.Learner;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class OrgEnrollmentProgressServiceTest {
    @Test void departmentLessonsCannotInflateOfficialCertificationProgress() {
        var rows = mock(InstitutionCertificationLearnerRepository.class);
        var lessons = mock(LessonRepository.class);
        var completed = mock(LearnerCompletedLessonRepository.class);
        var service = new OrgEnrollmentProgressService(rows, lessons, completed);
        var certification = new Certification(); certification.setCertificationId(5L);
        var allocation = new InstitutionCertificate(); allocation.setCertification(certification);
        var learner = new Learner(); learner.setLearnerId(8L);
        var row = new InstitutionCertificationLearner(); row.setInstitutionCert(allocation); row.setLearner(learner);
        when(lessons.findCatalogLessonIdsByCertificationId(5L)).thenReturn(List.of(1L, 2L));
        when(completed.completedLessonIds(8L, 5L)).thenReturn(List.of(1L, 99L, 100L));
        service.sync(row);
        assertEquals(50, row.getProgressPercentage().intValue());
        assertNull(row.getCompletedAt());
        when(completed.completedLessonIds(8L, 5L)).thenReturn(List.of(1L, 2L, 99L));
        service.sync(row);
        assertEquals(100, row.getProgressPercentage().intValue());
        assertNotNull(row.getCompletedAt());
    }
}
