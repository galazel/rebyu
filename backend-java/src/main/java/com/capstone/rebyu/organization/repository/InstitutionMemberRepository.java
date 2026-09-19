package com.capstone.rebyu.institution.repository;

import com.capstone.rebyu.institution.entity.InstitutionMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstitutionMemberRepository extends JpaRepository<InstitutionMember, Long> {
    List<InstitutionMember> findByInstitution_InstitutionId(Long institutionId);
    List<InstitutionMember> findByUser_UserId(Long userId);
    List<InstitutionMember> findByInstitution_InstitutionIdAndUser_UserId(Long institutionId, Long userId);
}
