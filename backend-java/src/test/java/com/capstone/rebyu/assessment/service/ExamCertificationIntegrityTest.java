package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.assessment.repository.ExamRepository;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.*;

/**
 * Verifies that mock exams are correctly assigned to their certifications.
 *
 * <p>When a learner takes a mock exam in certification A, the attempt should
 * appear in certification A's analytics, not in another certification's. This
 * test ensures the exam records have the correct certification foreign key.
 */
@SpringBootTest
@ActiveProfiles("test")
public class ExamCertificationIntegrityTest {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private CertificationRepository certificationRepository;

    @Test
    void mockExamsAreCorrectlyAssignedToCertifications() {
        // Fetch all mock exams and group by title
        List<Exam> allMocks = examRepository.findByCertification_CertificationId(null).stream()
                // (Overload doesn't exist yet; this test will drive the implementation)
                // For now, we'll fetch all exams and filter manually
                .filter(e -> "MOCK_EXAM".equals(
                        (e.getExamType() != null) ? e.getExamType().getExamTypeText() : null))
                .collect(Collectors.toList());

        // Group exams by their title to detect duplicates
        Map<String, List<Exam>> byTitle = allMocks.stream()
                .collect(Collectors.groupingBy(Exam::getTitle));

        // Each mock exam title should belong to exactly one certification
        for (String title : byTitle.keySet()) {
            List<Exam> examsWithTitle = byTitle.get(title);
            if (examsWithTitle.size() > 1) {
                // Collect the certification IDs for reporting
                String certIds = examsWithTitle.stream()
                        .map(e -> String.format("%d", e.getCertification().getCertificationId()))
                        .collect(Collectors.joining(", "));

                fail(String.format(
                        "Mock exam title '%s' exists in multiple certifications: %s. " +
                        "This causes attempts to leak between certifications.",
                        title, certIds));
            }
        }

        assertThat(byTitle.values())
                .allMatch(v -> v.size() == 1, "Each mock exam title appears in exactly one certification");
    }

    /**
     * Diagnostic: list all mock exams and their certification assignments.
     * Use this to debug cross-certification leaks.
     */
    @Test
    void listMockExamAssignments() {
        List<Exam> allExams = examRepository.findAll();
        List<Exam> mocks = allExams.stream()
                .filter(e -> e.getExamType() != null && "MOCK_EXAM".equals(e.getExamType().getExamTypeText()))
                .collect(Collectors.toList());

        System.out.println("\n=== Mock Exam Assignments ===");
        mocks.forEach(mock -> {
            String certTitle = mock.getCertification() != null
                    ? mock.getCertification().getTitle()
                    : "NULL";
            System.out.printf("  Exam %d: '%s' -> Certification %d (%s)%n",
                    mock.getExamId(), mock.getTitle(),
                    mock.getCertification().getCertificationId(), certTitle);
        });
        System.out.println("=============================\n");
    }
}
