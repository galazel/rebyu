package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.CertificationAssessmentTimers;
import com.capstone.rebyu.assessment.dto.GlobalAssessmentTimers;
import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssessmentTimerService {
    private static final GlobalAssessmentTimers DEFAULT_GLOBAL_TIMERS = new GlobalAssessmentTimers(10, 30, 60);
    private static final int DEFAULT_DIAGNOSTIC_MINUTES = 96;
    private static final int DEFAULT_MOCK_EXAM_MINUTES = 150;

    private final JdbcTemplate jdbc;
    private final CertificationRepository certifications;

    public GlobalAssessmentTimers getGlobal() {
        return jdbc.query("""
                SELECT lesson_quiz_minutes, middle_exam_minutes, major_exam_minutes
                FROM assessment_timer_settings WHERE id = 1
                """, (rs, row) -> new GlobalAssessmentTimers(rs.getInt(1), rs.getInt(2), rs.getInt(3)))
                .stream().findFirst().orElse(DEFAULT_GLOBAL_TIMERS);
    }

    public GlobalAssessmentTimers saveGlobal(GlobalAssessmentTimers timers) {
        jdbc.update("""
                INSERT INTO assessment_timer_settings (id, lesson_quiz_minutes, middle_exam_minutes, major_exam_minutes)
                VALUES (1, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET
                    lesson_quiz_minutes = EXCLUDED.lesson_quiz_minutes,
                    middle_exam_minutes = EXCLUDED.middle_exam_minutes,
                    major_exam_minutes = EXCLUDED.major_exam_minutes
                """, timers.lessonQuizMinutes(), timers.middleExamMinutes(), timers.majorExamMinutes());
        return timers;
    }

    public CertificationAssessmentTimers getCertification(Long certificationId) {
        Certification certification = requireCertification(certificationId);
        return new CertificationAssessmentTimers(certification.getDiagnosticMinutes(), certification.getMockExamMinutes());
    }

    @Transactional
    public CertificationAssessmentTimers saveCertification(Long certificationId, CertificationAssessmentTimers timers) {
        Certification certification = requireCertification(certificationId);
        certification.setDiagnosticMinutes(timers.diagnosticMinutes());
        certification.setMockExamMinutes(timers.mockExamMinutes());
        return timers;
    }

    public Integer durationMinutes(Exam exam) {
        String type = certificationExamType(exam);
        return durationMinutes(exam, globalMinutes(type, DEFAULT_GLOBAL_TIMERS) != null ? getGlobal() : null);
    }

    static boolean controlsDuration(Exam exam) {
        String type = certificationExamType(exam);
        return globalMinutes(type, DEFAULT_GLOBAL_TIMERS) != null || certificationMinutes(exam, type) != null;
    }

    static Integer durationMinutes(Exam exam, GlobalAssessmentTimers global) {
        if (exam == null) return null;
        String type = certificationExamType(exam);
        Integer shared = globalMinutes(type, global != null ? global : DEFAULT_GLOBAL_TIMERS);
        if (shared != null) return shared;
        Integer certification = certificationMinutes(exam, type);
        if (certification != null) return certification;
        Integer examDuration = exam.getDurationMinutes();
        if (examDuration != null) return examDuration;
        return switch (type) {
            case "DIAGNOSTIC", "DIAGNOSTIC_EXAM" -> DEFAULT_DIAGNOSTIC_MINUTES;
            case "MOCK_EXAM", "MOCK" -> DEFAULT_MOCK_EXAM_MINUTES;
            case null, default -> null;
        };
    }

    private static Integer globalMinutes(String type, GlobalAssessmentTimers global) {
        return switch (type) {
            case "LESSON_QUIZ", "QUIZ" -> global.lessonQuizMinutes();
            case "MIDDLE_EXAM", "MODULE_EXAM", "MIDDLE_CATEGORY_QUIZ" -> global.middleExamMinutes();
            case "MAJOR_EXAM", "MAJOR_CATEGORY_EXAM", "MAJOR_CATEGORY_QUIZ" -> global.majorExamMinutes();
            case null, default -> null;
        };
    }

    private static Integer certificationMinutes(Exam exam, String type) {
        return switch (type) {
            case "DIAGNOSTIC", "DIAGNOSTIC_EXAM" ->
                    exam.getCertification() == null ? null : exam.getCertification().getDiagnosticMinutes();
            case "MOCK_EXAM", "MOCK" ->
                    exam.getCertification() == null ? null : exam.getCertification().getMockExamMinutes();
            case null, default -> null;
        };
    }

    private static String certificationExamType(Exam exam) {
        if (exam == null || exam.getOwnerDepartment() != null || exam.getLearner() != null
                || exam.getExamType() == null) {
            return null;
        }
        return exam.getExamType().getExamTypeText();
    }

    private Certification requireCertification(Long certificationId) {
        return certifications.findById(certificationId)
                .orElseThrow(() -> new EntityNotFoundException("Certification not found: " + certificationId));
    }
}
