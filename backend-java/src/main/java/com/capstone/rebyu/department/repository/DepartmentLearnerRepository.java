package com.capstone.rebyu.department.repository;

import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentLearnerRepository extends JpaRepository<DepartmentLearner, Long> {
    List<DepartmentLearner> findByDepartment_DepartmentId(Long departmentId);

    List<DepartmentLearner> findByInstitutionCertLearner_Learner_LearnerIdAndStatus(
            Long learnerId, DepartmentLearner.Status status);

    boolean existsByDepartment_DepartmentIdAndInstitutionCertLearner_Learner_LearnerIdAndStatus(
            Long departmentId, Long learnerId, DepartmentLearner.Status status);

    boolean existsByDepartmentAndInstitutionCertLearner(
            Department department, InstitutionCertificationLearner institutionCertLearner);

    Optional<DepartmentLearner> findByDepartmentAndInstitutionCertLearner(
            Department department, InstitutionCertificationLearner institutionCertLearner);


    interface GroupProgress {
        Long getDepartmentId();
        String getDepartmentName();
        long getLearners();
        Double getAverageProgress();
        long getCompletedLearners();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT g.departmentId AS departmentId,
                   g.departmentName AS departmentName,
                   COUNT(a) AS learners,
                   AVG(l.progressPercentage) AS averageProgress,
                   SUM(CASE WHEN l.completedAt IS NOT NULL THEN 1 ELSE 0 END) AS completedLearners
            FROM DepartmentLearner a
            JOIN a.department g
            JOIN a.institutionCertLearner l
            WHERE g.institution.institutionId = :institutionId
              AND a.status = com.capstone.rebyu.department.entity.DepartmentLearner.Status.active
              AND g.status = com.capstone.rebyu.department.entity.Department.Status.active
              AND a.assignedAt <= :asOf
            GROUP BY g.departmentId, g.departmentName
            ORDER BY g.departmentName
            """)
    List<GroupProgress> groupProgressByInstitution(
            @org.springframework.data.repository.query.Param("institutionId") Long institutionId,
            @org.springframework.data.repository.query.Param("asOf") java.time.LocalDateTime asOf);


    interface AssignmentGroup {
        Long getInstitutionCertLearnerId();
        Long getDepartmentId();
        String getDepartmentName();
    }

    @org.springframework.data.jpa.repository.Query("""
            SELECT l.institutionCertLearnerId AS institutionCertLearnerId,
                   g.departmentId AS departmentId,
                   g.departmentName AS departmentName
            FROM DepartmentLearner a
            JOIN a.department g
            JOIN a.institutionCertLearner l
            WHERE g.institution.institutionId = :institutionId
              AND a.status = com.capstone.rebyu.department.entity.DepartmentLearner.Status.active
              AND g.status = com.capstone.rebyu.department.entity.Department.Status.active
            """)
    List<AssignmentGroup> assignmentGroupsByInstitution(
            @org.springframework.data.repository.query.Param("institutionId") Long institutionId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT l.institutionCertLearnerId
            FROM DepartmentLearner a
            JOIN a.department g
            JOIN a.institutionCertLearner l
            WHERE g.departmentId IN :departmentIds
              AND a.status = com.capstone.rebyu.department.entity.DepartmentLearner.Status.active
              AND g.status = com.capstone.rebyu.department.entity.Department.Status.active
            """)
    List<Long> institutionCertLearnerIdsByDepartments(
            @org.springframework.data.repository.query.Param("departmentIds") java.util.Collection<Long> departmentIds);
}
