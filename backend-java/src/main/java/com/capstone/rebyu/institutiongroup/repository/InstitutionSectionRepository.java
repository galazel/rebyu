package com.capstone.rebyu.institutiongroup.repository;

import com.capstone.rebyu.institutiongroup.entity.InstitutionSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstitutionSectionRepository extends JpaRepository<InstitutionSection, Long> {

    List<InstitutionSection> findByInstitutionGroup_InstitutionGroupIdAndStatusOrderByCreatedAtAsc(
            Long institutionGroupId, InstitutionSection.Status status);

    Optional<InstitutionSection> findBySectionIdAndInstitutionGroup_InstitutionGroupId(
            Long sectionId, Long institutionGroupId);

    boolean existsByInstitutionGroup_InstitutionGroupIdAndSectionNameIgnoreCaseAndStatus(
            Long institutionGroupId, String sectionName, InstitutionSection.Status status);
}
