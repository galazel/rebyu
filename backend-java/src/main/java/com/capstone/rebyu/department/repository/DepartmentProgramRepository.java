package com.capstone.rebyu.department.repository;

import com.capstone.rebyu.department.entity.DepartmentProgram;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentProgramRepository extends JpaRepository<DepartmentProgram, Long> {

    List<DepartmentProgram> findByDepartment_DepartmentIdAndStatusOrderByProgramNameAsc(
            Long departmentId, DepartmentProgram.Status status);

    Optional<DepartmentProgram> findByProgramIdAndDepartment_DepartmentIdAndStatus(
            Long programId, Long departmentId, DepartmentProgram.Status status);

    boolean existsByDepartment_DepartmentIdAndProgramNameIgnoreCaseAndStatus(
            Long departmentId, String programName, DepartmentProgram.Status status);

    boolean existsByDepartment_DepartmentIdAndProgramCodeIgnoreCaseAndStatus(
            Long departmentId, String programCode, DepartmentProgram.Status status);
}
