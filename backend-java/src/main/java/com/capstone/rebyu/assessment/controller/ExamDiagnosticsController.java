package com.capstone.rebyu.assessment.controller;

import com.capstone.rebyu.assessment.service.ExamCertificationRepairService;
import com.capstone.rebyu.assessment.service.ExamCertificationRepairService.ExamWithCert;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only diagnostic endpoints for assessment integrity.
 *
 * <p>These endpoints are NOT production-facing and should only be exposed
 * to administrators. They help diagnose cross-certification data leaks where
 * attempts on one certification appear under another certification's analytics.
 */
@RestController
@RequestMapping("/api/admin/diagnostics")
@RequiredArgsConstructor
public class ExamDiagnosticsController {

    private final ExamCertificationRepairService repairService;

    /**
     * List all mock exams and their current certification assignments.
     * Identifies duplicates that cause analytics leaks.
     *
     * <p>Example response:
     * <pre>
     * {
     *   "Mock Exam": [
     *     { "examId": 123, "title": "Mock Exam", "certificationId": 4, "certificationTitle": "IT Passport" },
     *     { "examId": 456, "title": "Mock Exam", "certificationId": 13, "certificationTitle": "TOPCIT" }
     *   ]
     * }
     * </pre>
     *
     * <p>If any title appears more than once, learners' attempts are bleeding
     * between certifications in analytics.
     */
    @GetMapping("/exam-certifications")
    public Map<String, List<ExamWithCert>> getMockExamAssignments() {
        return repairService.findMockExamDuplicates();
    }

    /**
     * Plain-text diagnostic report of all mock exam assignments.
     * Useful for quick CLI consumption or debugging.
     */
    @GetMapping("/exam-certifications/report")
    public String getMockExamReport() {
        return repairService.reportMockExamState();
    }

    /**
     * List all mock exams with their certifications.
     */
    @GetMapping("/mock-exams")
    public List<ExamWithCert> listAllMockExams() {
        return repairService.listAllMockExams();
    }

    /**
     * Repair a mock exam's certification assignment (ADMIN ONLY).
     *
     * <p>Call this when an exam is assigned to the wrong certification.
     * This is a manual operation—the caller must verify correctness before
     * submitting, because it immediately updates the database.
     *
     * @param examId the exam to reassign
     * @param certificationId the correct certification for this exam
     * @return a summary of what was changed
     */
    @PostMapping("/exam-certifications/{examId}/move-to/{certificationId}")
    public Map<String, Object> repairExamCertification(
            @PathVariable Long examId,
            @PathVariable Long certificationId) {
        boolean changed = repairService.repairExamCertification(examId, certificationId);
        return Map.of(
                "examId", examId,
                "targetCertificationId", certificationId,
                "changed", changed,
                "message", changed
                        ? "Exam reassigned successfully. Analytics will now show attempts under the correct certification."
                        : "Exam was already assigned to this certification; no change needed."
        );
    }
}
