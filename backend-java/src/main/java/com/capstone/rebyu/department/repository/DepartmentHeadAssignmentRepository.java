package com.capstone.rebyu.department.repository;

import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import com.capstone.rebyu.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DepartmentHeadAssignmentRepository extends JpaRepository<DepartmentHeadAssignment, Long> {
    List<DepartmentHeadAssignment> findByDepartment_DepartmentId(Long departmentId);

    List<DepartmentHeadAssignment> findByUser_UserId(Long userId);

    boolean existsByDepartmentAndUserAndStatus(
            Department department, User user, DepartmentHeadAssignment.Status status);

    Optional<DepartmentHeadAssignment> findByDepartmentAndUser(Department department, User user);

    @Query("""
            SELECT COUNT(DISTINCT a.user.userId)
            FROM DepartmentHeadAssignment a
            WHERE a.department.institution.institutionId = :institutionId
              AND a.status = :status
            """)
    long countDistinctActiveAuthorities(
            @Param("institutionId") Long institutionId,
            @Param("status") DepartmentHeadAssignment.Status status);
}
