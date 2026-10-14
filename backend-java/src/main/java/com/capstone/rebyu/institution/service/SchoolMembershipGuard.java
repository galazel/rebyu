package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
import com.capstone.rebyu.notification.repository.LearnerInvitationRepository;
import com.capstone.rebyu.onboarding.entity.DepartmentHeadInvitation;
import com.capstone.rebyu.onboarding.repository.DepartmentHeadInvitationRepository;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

/**
 * A person belongs to one school: as its owner or a department head, as an enrolled learner,
 * or through a pending invitation from it. This finds the other school, if any.
 */
@Component
@RequiredArgsConstructor
public class SchoolMembershipGuard {

    private final UserRepository users;
    private final LearnerRepository learners;
    private final DepartmentHeadRepository members;
    private final InstitutionCertificationLearnerRepository enrolments;
    private final LearnerInvitationRepository learnerInvitations;
    private final DepartmentHeadInvitationRepository headInvitations;

    /** The name of another institution this email already belongs to, if any. */
    @Transactional(readOnly = true)
    public Optional<String> otherSchool(String email, Long institutionId) {
        if (email == null || email.isBlank()) return Optional.empty();
        String clean = email.trim();

        var user = users.findByEmailIgnoreCase(clean).orElse(null);
        if (user != null) {
            Optional<String> asMember = members.findByUser_UserId(user.getUserId()).stream()
                    .map(member -> member.getInstitution())
                    .filter(institution -> institution != null
                            && !Objects.equals(institution.getInstitutionId(), institutionId))
                    .map(Institution::getInstitutionName)
                    .findFirst();
            if (asMember.isPresent()) return asMember;

            var learner = learners.findByUser_UserId(user.getUserId()).orElse(null);
            if (learner != null) {
                Optional<String> asLearner = enrolments.findByLearner_LearnerId(learner.getLearnerId()).stream()
                        .filter(e -> e.getStatus() != InstitutionCertificationLearner.Status.revoked)
                        .map(e -> e.getInstitutionCert() == null ? null : e.getInstitutionCert().getInstitution())
                        .filter(institution -> institution != null
                                && !Objects.equals(institution.getInstitutionId(), institutionId))
                        .map(Institution::getInstitutionName)
                        .findFirst();
                if (asLearner.isPresent()) return asLearner;
            }
        }

        Optional<String> invitedAsLearner = learnerInvitations
                .findByEmailIgnoreCaseAndStatusOrderBySentAtDesc(clean, LearnerInvitation.Status.PENDING).stream()
                .filter(inv -> inv.getExpiresAt() == null || inv.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(inv -> inv.getInstitutionCert() == null ? null : inv.getInstitutionCert().getInstitution())
                .filter(institution -> institution != null
                        && !Objects.equals(institution.getInstitutionId(), institutionId))
                .map(Institution::getInstitutionName)
                .findFirst();
        if (invitedAsLearner.isPresent()) return invitedAsLearner;

        return headInvitations.findByEmailIgnoreCaseAndStatus(clean, DepartmentHeadInvitation.Status.PENDING).stream()
                .filter(inv -> inv.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(inv -> inv.getDepartment().getInstitution())
                .filter(institution -> institution != null
                        && !Objects.equals(institution.getInstitutionId(), institutionId))
                .map(Institution::getInstitutionName)
                .findFirst();
    }

    /** Throws when the email already belongs to another institution. */
    public void requireNoOtherSchool(String email, Long institutionId) {
        otherSchool(email, institutionId).ifPresent(name -> {
            throw new IllegalArgumentException(
                    "This person already belongs to " + name + ". A person can only belong to one school.");
        });
    }
}
