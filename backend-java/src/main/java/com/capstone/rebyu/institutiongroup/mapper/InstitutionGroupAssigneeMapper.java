package com.capstone.rebyu.institutiongroup.mapper;

import com.capstone.rebyu.institutiongroup.dto.InstitutionGroupAssigneeDto;
import com.capstone.rebyu.institutiongroup.entity.InstitutionGroupAssignee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InstitutionGroupAssigneeMapper {
    @Mapping(source = "institutionGroup.institutionGroupId", target = "institutionGroupId")
    @Mapping(source = "institutionCertLearner.institutionCertLearnerId", target = "institutionCertLearnerId")
    @Mapping(source = "institutionCertLearner.institutionCert.institutionCertId", target = "institutionCertId")
    @Mapping(source = "institutionCertLearner.learner.learnerId", target = "learnerId")
    @Mapping(source = "assignedBy.userId", target = "assignedBy")
    @Mapping(source = "section.sectionId", target = "sectionId")
    @Mapping(source = "section.sectionName", target = "sectionName")
    InstitutionGroupAssigneeDto toDto(InstitutionGroupAssignee entity);

    @Mapping(source = "institutionGroupId", target = "institutionGroup.institutionGroupId")
    @Mapping(source = "institutionCertLearnerId", target = "institutionCertLearner.institutionCertLearnerId")
    @Mapping(source = "assignedBy", target = "assignedBy.userId")
    InstitutionGroupAssignee toEntity(InstitutionGroupAssigneeDto dto);
}
