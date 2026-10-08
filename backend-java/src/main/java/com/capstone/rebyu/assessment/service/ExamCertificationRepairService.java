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

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamCertificationRepairService {

    private final ExamRepository examRepository;
    private final CertificationRepository certificationRepository;

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

    public record ExamWithCert(
            Long examId,
            String title,
            Long certificationId,
            String certificationTitle) {
    }
}
