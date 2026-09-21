package com.capstone.rebyu.department.repository;

import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentLearnerRepository extends JpaRepository<DepartmentLearner, Long> {
    List<DepartmentLearner> findByDepartment_DepartmentId(Long departmentId);

    /** A learner's own group memberships -- the learner side of a class. */
    List<DepartmentLearner> findByInstitutionCertLearner_Learner_LearnerIdAndStatus(
            Long learnerId, DepartmentLearner.Status status);

    boolean existsByDepartment_DepartmentIdAndInstitutionCertLearner_Learner_LearnerIdAndStatus(
            Long departmentId, Long learnerId, DepartmentLearner.Status status);

    boolean existsByDepartmentAndInstitutionCertLearner(
            Department department, InstitutionCertificationLearner institutionCertLearner);

    // Regardless of status -- used to reactivate an archived assignment
    // instead of colliding with it on re-add.
    Optional<DepartmentLearner> findByDepartmentAndInstitutionCertLearner(
            Department department, InstitutionCertificationLearner institutionCertLearner);

    // Per-group rollups (institution member dashboard)

    interface GroupProgress {
        Long getDepartmentId();
        String getDepartmentName();
        long getLearners();
        Double getAverageProgress();
        long getCompletedLearners();
    }

    /**
     * Completion per group across one institution, in one query.
     *
     * Only active assignees in active groups count: an archived assignment is
     * history, and letting it drag a group's average down would misreport the
     * people actually being taught right now.
     */
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
            GROUP BY g.departmentId, g.departmentName
            ORDER BY g.departmentName
            """)
    List<GroupProgress> groupProgressByInstitution(
            @org.springframework.data.repository.query.Param("institutionId") Long institutionId);

    // Group membership per assignment (institution learner roster)

    interface AssignmentGroup {
        Long getInstitutionCertLearnerId();
        Long getDepartmentId();
        String getDepartmentName();
    }

    /**
     * The group each assignment belongs to, across one institution, in one query.
     *
     * Active assignees in active groups only, matching groupProgressByInstitution
     * above: an archived membership is history, and showing it on the roster
     * would name a group the learner is no longer being taught in. A learner
     * with no active membership simply has no row here -- the roster reads that
     * as "not in a group" rather than inventing one.
     */
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
}
