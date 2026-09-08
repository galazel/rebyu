package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Detects and repairs mock exams that are assigned to the wrong certification.
 *
 * <p>When analytics queries attempts scoped to a certification, they join:
 * {@code assessment_attempts.exam_id → exams.exam_id → exams.certification_id}.
 * If an exam's certification_id is wrong, all attempts on that exam appear
 * under the wrong certification in analytics.
 *
 * <p>This service identifies mock exams with duplicate titles (which should
 * map one-to-one to certifications) and offers repair options. It does NOT
 * auto-repair—it reports the problem and leaves the fix to a human decision.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExamCertificationRepairService {

    private final ExamRepository examRepository;
    private final CertificationRepository certificationRepository;

    /**
     * Diagnostic: find all mock exams and check for duplicates by title.
     *
     * <p>Returns a map of title → list of exams with that title. If any list
     * has size > 1, those exams have a certification assignment problem.
     */
    public Map<String, List<ExamWithCert>> findMockExamDuplicates() {
        List<Exam> allExams = examRepository.findAll();
        List<Exam> mockExams = allExams.stream()
                .filter(e -> e.getExamType() != null && "MOCK_EXAM".equals(e.getExamType().getExamTypeText()))
                .collect(Collectors.toList());

        Map<String, List<ExamWithCert>> byTitle = new HashMap<>();
        for (Exam exam : mockExams) {
            String title = exam.getTitle();
            ExamWithCert entry = new ExamWithCert(
                    exam.getExamId(),
                    title,
                    exam.getCertification().getCertificationId(),
                    exam.getCertification().getTitle());
            byTitle.computeIfAbsent(title, k -> new ArrayList<>()).add(entry);
        }

        return byTitle;
    }

    /**
     * Report all mock exams and their certification assignments.
     * Use this to understand the current state before attempting repairs.
     */
    public List<ExamWithCert> listAllMockExams() {
        List<Exam> allExams = examRepository.findAll();
        return allExams.stream()
                .filter(e -> e.getExamType() != null && "MOCK_EXAM".equals(e.getExamType().getExamTypeText()))
                .map(e -> new ExamWithCert(
                        e.getExamId(),
                        e.getTitle(),
                        e.getCertification().getCertificationId(),
                        e.getCertification().getTitle()))
                .sorted(Comparator.comparing(ExamWithCert::title).thenComparing(ExamWithCert::certificationId))
                .collect(Collectors.toList());
    }

    /**
     * Diagnostic output suitable for logging or CLI reporting.
     */
    public String reportMockExamState() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n=== Mock Exam Certification Assignment Diagnostic ===\n");

        Map<String, List<ExamWithCert>> duplicates = findMockExamDuplicates();
        if (duplicates.isEmpty()) {
            sb.append("No mock exams found.\n");
            return sb.toString();
        }

        List<ExamWithCert> allMocks = listAllMockExams();
        sb.append(String.format("Total mock exams: %d\n", allMocks.size()));

        List<String> problems = new ArrayList<>();
        for (Map.Entry<String, List<ExamWithCert>> entry : duplicates.entrySet()) {
            if (entry.getValue().size() > 1) {
                problems.add(entry.getKey());
            }
        }

        if (problems.isEmpty()) {
            sb.append("Status: OK (no duplicate titles)\n");
        } else {
            sb.append(String.format("Status: PROBLEM FOUND (%d duplicate title(s))\n", problems.size()));
            for (String title : problems) {
                sb.append(String.format("\n  Title: '%s'\n", title));
                for (ExamWithCert exam : duplicates.get(title)) {
                    sb.append(String.format("    - Exam %d -> Certification %d (%s)\n",
                            exam.examId, exam.certificationId, exam.certificationTitle));
                }
            }
        }

        sb.append("\nAll mock exams:\n");
        for (ExamWithCert exam : allMocks) {
            sb.append(String.format("  Exam %d: '%s' -> Cert %d (%s)\n",
                    exam.examId, exam.title, exam.certificationId, exam.certificationTitle));
        }

        sb.append("=======================================================\n");
        return sb.toString();
    }

    /**
     * Repair a mock exam's certification assignment.
     *
     * <p>This is a manual operation: the caller must decide which certification
     * is correct and pass both the exam id and the target certification id.
     * This ensures no automatic "fixes" silently corrupt data.
     *
     * @param examId the exam to reassign
     * @param targetCertificationId the correct certification for this exam
     * @return true if the exam was updated, false if it already had the correct assignment
     */
    @Transactional
    public boolean repairExamCertification(Long examId, Long targetCertificationId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        Certification target = certificationRepository.findById(targetCertificationId)
                .orElseThrow(() -> new IllegalArgumentException("Certification not found: " + targetCertificationId));

        Long currentCertId = exam.getCertification().getCertificationId();
        if (currentCertId.equals(targetCertificationId)) {
            log.info("Exam {} already assigned to certification {}; no change needed",
                    examId, targetCertificationId);
            return false;
        }

        log.warn("REPAIR: Moving exam {} ('{}') from certification {} to certification {}",
                examId, exam.getTitle(), currentCertId, targetCertificationId);

        exam.setCertification(target);
        examRepository.save(exam);

        log.info("Exam {} reassigned successfully", examId);
        return true;
    }

    /**
     * Lightweight DTO for reporting exam-to-certification assignments.
     */
    public record ExamWithCert(
            Long examId,
            String title,
            Long certificationId,
            String certificationTitle) {
    }
}
