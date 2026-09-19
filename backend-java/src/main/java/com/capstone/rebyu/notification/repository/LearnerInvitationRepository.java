package com.capstone.rebyu.notification.repository;

import com.capstone.rebyu.notification.entity.LearnerInvitation;
import com.capstone.rebyu.user.entity.Learner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearnerInvitationRepository extends JpaRepository<LearnerInvitation, Long> {

    List<LearnerInvitation> findByInstitutionCert_Institution_InstitutionIdOrderBySentAtDesc(Long institutionId);
    boolean existsByInstitutionCert_InstitutionCertIdAndEmailIgnoreCaseAndStatus(
            Long institutionCertId, String email, LearnerInvitation.Status status);
    Optional<LearnerInvitation> findByTokenHash(String token);
}
