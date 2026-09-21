package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.assessment.entity.AssessmentAttempt;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.enrollment.entity.LearnerCertificationAward;
import com.capstone.rebyu.enrollment.repository.LearnerCertificationAwardRepository;
import com.capstone.rebyu.notification.service.EmailService;
import com.capstone.rebyu.notification.service.NotificationService;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Passing a certification's mock exam earns two things, told apart on
 * purpose: the certification's badge (the emblem the admin uploaded, shown
 * on the learner's card) and a numbered certificate of completion. Each is
 * announced in its own notification and its own email, and each is granted
 * once -- a better score on a retake changes nothing here.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CertificationAwardService {

    private static final String MOCK_EXAM = "MOCK_EXAM";

    private final LearnerCertificationAwardRepository awards;
    private final LearnerRepository learnerRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CertificatePdfService certificatePdfService;

    public record AwardDto(
            Long certificationId,
            String certificationTitle,
            boolean hasBadgeImage,
            LocalDateTime badgeAwardedAt,
            String certificateNumber,
            LocalDateTime certificateAwardedAt,
            java.math.BigDecimal scorePercentage) {}

    /** Called once an attempt's final score is known. No-op unless it is a passed mock exam. */
    @Transactional
    public void awardForAttempt(AssessmentAttempt attempt) {
        if (attempt == null || attempt.getExam() == null || attempt.getExam().getExamType() == null) return;
        if (!MOCK_EXAM.equals(attempt.getExam().getExamType().getExamTypeText())) return;
        if (!Boolean.TRUE.equals(attempt.getPassed())) return;

        Certification certification = attempt.getExam().getCertification();
        if (certification == null) return;
        Learner learner = learnerRepository.findById(attempt.getLearnerId()).orElse(null);
        if (learner == null) return;

        LearnerCertificationAward award = awards
                .findByLearnerIdAndCertificationId(learner.getLearnerId(), certification.getCertificationId())
                .orElseGet(() -> LearnerCertificationAward.builder()
                        .learnerId(learner.getLearnerId())
                        .certificationId(certification.getCertificationId())
                        .createdAt(LocalDateTime.now())
                        .build());

        boolean newBadge = award.getBadgeAwardedAt() == null;
        boolean newCertificate = award.getCertificateAwardedAt() == null;
        if (!newBadge && !newCertificate) return;

        LocalDateTime now = LocalDateTime.now();
        award.setAssessmentAttemptId(attempt.getAssessmentAttemptId());
        award.setScorePercentage(attempt.getPercentage());
        if (newBadge) award.setBadgeAwardedAt(now);
        if (newCertificate) {
            award.setCertificateAwardedAt(now);
            award.setCertificateNumber(nextCertificateNumber(now));
        }
        awards.save(award);

        String title = certification.getTitle();
        String name = displayName(learner);
        String email = learner.getUser() != null ? learner.getUser().getEmail() : null;
        String score = attempt.getPercentage() == null ? "" : attempt.getPercentage().stripTrailingZeros().toPlainString() + "%";

        // Two announcements, two emails: a badge and a certificate are
        // different things to a learner, and each deserves its own moment.
        if (newBadge) {
            notificationService.notify(learner.getUser(),
                    "You earned the " + title + " badge",
                    "You passed the " + title + " mock exam" + (score.isEmpty() ? "" : " with " + score)
                            + ". The badge now sits on your certification card.",
                    "/learner/certifications");
            if (email != null) {
                try {
                    emailService.sendBadgeEarned(email, name, title, score, certification.getBadgeImageKey() != null);
                } catch (RuntimeException e) {
                    log.warn("Badge email to {} failed: {}", email, e.getMessage());
                }
            }
        }
        if (newCertificate) {
            notificationService.notify(learner.getUser(),
                    "Certificate of completion: " + title,
                    "Certificate " + award.getCertificateNumber() + " has been issued to you for completing " + title + ".",
                    "/learner/certifications");
            if (email != null) {
                try {
                    byte[] pdf = certificatePdfService.render(name, title, award.getCertificateNumber(), now);
                    emailService.sendCertificateIssued(email, name, title, award.getCertificateNumber(), score, now,
                            new EmailService.Attachment(award.getCertificateNumber() + ".pdf", "application/pdf", pdf));
                } catch (RuntimeException e) {
                    log.warn("Certificate email to {} failed: {}", email, e.getMessage());
                }
            }
        }
        log.info("Learner {} awarded {}{} for certification {}", learner.getLearnerId(),
                newBadge ? "badge " : "", newCertificate ? "certificate " + award.getCertificateNumber() : "",
                certification.getCertificationId());
    }

    @Transactional(readOnly = true)
    public List<AwardDto> awardsOf(Long learnerId, java.util.function.Function<Long, Certification> certificationLookup) {
        return awards.findByLearnerIdOrderByCreatedAtDesc(learnerId).stream().map(a -> {
            Certification c = certificationLookup.apply(a.getCertificationId());
            return new AwardDto(a.getCertificationId(),
                    c == null ? null : c.getTitle(),
                    c != null && c.getBadgeImageKey() != null,
                    a.getBadgeAwardedAt(), a.getCertificateNumber(), a.getCertificateAwardedAt(), a.getScorePercentage());
        }).toList();
    }

    /** REBYU-CERT-2026-4F7K2Q: year plus a short code, never a guessable sequence. */
    private String nextCertificateNumber(LocalDateTime now) {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String candidate;
        do {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < 6; i++) code.append(alphabet.charAt(ThreadLocalRandom.current().nextInt(alphabet.length())));
            candidate = "REBYU-CERT-" + now.format(DateTimeFormatter.ofPattern("yyyy")) + "-" + code;
        } while (awards.existsByCertificateNumber(candidate));
        return candidate;
    }

    private static String displayName(Learner learner) {
        String full = ((learner.getFirstName() == null ? "" : learner.getFirstName()) + " "
                + (learner.getLastName() == null ? "" : learner.getLastName())).trim();
        return full.isEmpty() ? (learner.getUsername() == null ? "Learner" : learner.getUsername()) : full;
    }
}
