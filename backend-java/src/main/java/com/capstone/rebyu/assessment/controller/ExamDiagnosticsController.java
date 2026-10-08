package com.capstone.rebyu.assessment.controller;

import com.capstone.rebyu.assessment.service.ExamCertificationRepairService;
import com.capstone.rebyu.assessment.service.ExamCertificationRepairService.ExamWithCert;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/diagnostics")
@RequiredArgsConstructor
public class ExamDiagnosticsController {

    private final ExamCertificationRepairService repairService;
    private final RoleGuard guard;

    @ModelAttribute
    void requireAdmin(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
    }

    @GetMapping("/exam-certifications")
    public Map<String, List<ExamWithCert>> getMockExamAssignments() {
        return repairService.findMockExamDuplicates();
    }

    @GetMapping("/exam-certifications/report")
    public String getMockExamReport() {
        return repairService.reportMockExamState();
    }

    @GetMapping("/mock-exams")
    public List<ExamWithCert> listAllMockExams() {
        return repairService.listAllMockExams();
    }

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
