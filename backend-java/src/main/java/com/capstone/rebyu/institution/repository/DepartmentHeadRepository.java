package com.capstone.rebyu.institution.repository;

import com.capstone.rebyu.institution.entity.DepartmentHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentHeadRepository extends JpaRepository<DepartmentHead, Long> {
    List<DepartmentHead> findByInstitution_InstitutionId(Long institutionId);
    List<DepartmentHead> findByUser_UserId(Long userId);
    List<DepartmentHead> findByInstitution_InstitutionIdAndUser_UserId(Long institutionId, Long userId);
}
