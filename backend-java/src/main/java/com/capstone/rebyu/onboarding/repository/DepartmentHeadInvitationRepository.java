package com.capstone.rebyu.onboarding.repository;

import com.capstone.rebyu.onboarding.entity.DepartmentHeadInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentHeadInvitationRepository extends JpaRepository<DepartmentHeadInvitation, Long> {
    Optional<DepartmentHeadInvitation> findByCode(String code);

    boolean existsByCode(String code);

    List<DepartmentHeadInvitation> findByEmailIgnoreCaseAndStatus(String email, DepartmentHeadInvitation.Status status);

    List<DepartmentHeadInvitation> findByDepartment_DepartmentIdOrderByCreatedAtDesc(Long departmentId);

    List<DepartmentHeadInvitation> findByDepartment_DepartmentIdAndEmailIgnoreCaseAndStatus(
            Long departmentId, String email, DepartmentHeadInvitation.Status status);
}
