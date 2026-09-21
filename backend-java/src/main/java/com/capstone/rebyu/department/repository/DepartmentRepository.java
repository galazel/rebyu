package com.capstone.rebyu.department.repository;

import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByInstitution_InstitutionId(Long institutionId);

    List<Department> findByInstitutionCert_InstitutionCertId(Long institutionCertId);

    long countByInstitution_InstitutionIdAndStatus(Long institutionId, Department.Status status);

    /** Active groups a non-owner institution member is actively authorized to manage. */
    @Query("""
            SELECT DISTINCT g
            FROM Department g
            JOIN DepartmentHeadAssignment a ON a.department = g
            WHERE g.institution.institutionId = :institutionId
              AND a.user.userId = :userId
              AND g.status = :groupStatus
              AND a.status = :authorityStatus
            ORDER BY g.createdAt DESC
            """)
    List<Department> findActiveAuthorizedGroups(
            @Param("institutionId") Long institutionId,
            @Param("userId") Long userId,
            @Param("groupStatus") Department.Status groupStatus,
            @Param("authorityStatus") DepartmentHeadAssignment.Status authorityStatus);
}
