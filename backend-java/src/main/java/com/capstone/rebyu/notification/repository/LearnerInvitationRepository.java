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

    /**
     * One person's own invitations, matched on the address they were sent to.
     *
     * <p>Replaces a client-side filter. The learner shell used to fetch EVERY
     * invitation on the platform every thirty seconds and keep the rows whose
     * email matched its own -- so each learner's browser was handed every
     * other learner's name, address, invitation status and inviting
     * institution.
     */
    List<LearnerInvitation> findByEmailIgnoreCaseAndStatusOrderBySentAtDesc(
            String email, LearnerInvitation.Status status);

    /**
     * Invitations belonging to one group, by status.
     *
     * <p>Used when a group is archived: its still-PENDING invitations point at
     * a group that will no longer exist, so they are revoked and the slots they
     * were holding are given back to the allocation.
     */
    List<LearnerInvitation> findByDepartment_DepartmentIdAndStatus(
            Long departmentId, LearnerInvitation.Status status);
}
