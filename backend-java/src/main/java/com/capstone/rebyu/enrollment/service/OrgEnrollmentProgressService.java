package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.progress.repository.LearnerCompletedLessonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Keeps an institution enrollment's stored progress equal to the learner's
 * real finished lessons in that certification.
 *
 * <p>The column used to be written as 0 when the seat was assigned and never
 * again, so every institution stat that averaged it read 0%. Lesson progress
 * belongs to the learner, not the seat, so a learner who studied the
 * certification on their own before being invited arrives with it counted.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrgEnrollmentProgressService {

    private final InstitutionCertificationLearnerRepository institutionCertLearnerRepository;
    private final LessonRepository lessonRepository;
    private final LearnerCompletedLessonRepository completedLessonRepository;

    /** Recomputes every institution seat this learner holds for the certification. */
    @Transactional
    public void sync(Long learnerId, Long certificationId) {
        if (learnerId == null || certificationId == null) return;
        List<InstitutionCertificationLearner> rows = institutionCertLearnerRepository.findByLearner_LearnerId(learnerId).stream()
                .filter(row -> certificationId.equals(certificationIdOf(row)))
                .toList();
        if (!rows.isEmpty()) apply(rows, learnerId, certificationId);
    }

    /** Recomputes one seat, e.g. the one an accepted invitation just created. */
    @Transactional
    public void sync(InstitutionCertificationLearner row) {
        Long certificationId = certificationIdOf(row);
        if (row.getLearner() == null || certificationId == null) return;
        apply(List.of(row), row.getLearner().getLearnerId(), certificationId);
    }

    /** Brings seats that predate this service up to date once at startup. Idempotent. */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfill() {
        try {
            institutionCertLearnerRepository.findAll().stream()
                    .filter(row -> row.getLearner() != null && certificationIdOf(row) != null)
                    .map(row -> List.of(row.getLearner().getLearnerId(), certificationIdOf(row)))
                    .distinct()
                    .forEach(pair -> sync(pair.get(0), pair.get(1)));
        } catch (RuntimeException e) {
            log.warn("Institution enrollment progress backfill failed", e);
        }
    }

    private static Long certificationIdOf(InstitutionCertificationLearner row) {
        return row.getInstitutionCert() == null || row.getInstitutionCert().getCertification() == null
                ? null
                : row.getInstitutionCert().getCertification().getCertificationId();
    }

    private void apply(List<InstitutionCertificationLearner> rows, Long learnerId, Long certificationId) {
        int total = lessonRepository.findOfficialLessonIdsByCertificationId(certificationId).size();
        long done = completedLessonRepository
                .countByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationId(
                        learnerId, certificationId);
        BigDecimal percent = total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(Math.min(100.0, done * 100.0 / total)).setScale(2, RoundingMode.HALF_UP);
        boolean finished = total > 0 && done >= total;

        for (InstitutionCertificationLearner row : rows) {
            boolean changed = row.getProgressPercentage() == null
                    || row.getProgressPercentage().compareTo(percent) != 0;
            row.setProgressPercentage(percent);
            if (finished && row.getCompletedAt() == null) {
                row.setCompletedAt(LocalDateTime.now());
                changed = true;
            } else if (!finished && row.getCompletedAt() != null) {
                row.setCompletedAt(null);
                changed = true;
            }
            if (changed) institutionCertLearnerRepository.save(row);
        }
    }
}
