package com.capstone.rebyu.department.repository;

import com.capstone.rebyu.department.entity.InstitutionSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstitutionSectionRepository extends JpaRepository<InstitutionSection, Long> {

    List<InstitutionSection> findByDepartment_DepartmentIdAndStatusOrderByCreatedAtAsc(
            Long departmentId, InstitutionSection.Status status);

    Optional<InstitutionSection> findBySectionIdAndDepartment_DepartmentId(
            Long sectionId, Long departmentId);

    boolean existsByDepartment_DepartmentIdAndInstitutionCert_InstitutionCertIdAndSectionNameIgnoreCaseAndStatus(
            Long departmentId, Long institutionCertId, String sectionName, InstitutionSection.Status status);
}
