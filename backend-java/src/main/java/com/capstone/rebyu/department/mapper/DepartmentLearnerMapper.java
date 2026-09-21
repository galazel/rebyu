package com.capstone.rebyu.department.mapper;

import com.capstone.rebyu.department.dto.DepartmentLearnerDto;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepartmentLearnerMapper {
    @Mapping(source = "department.departmentId", target = "departmentId")
    @Mapping(source = "institutionCertLearner.institutionCertLearnerId", target = "institutionCertLearnerId")
    @Mapping(source = "institutionCertLearner.institutionCert.institutionCertId", target = "institutionCertId")
    @Mapping(source = "institutionCertLearner.learner.learnerId", target = "learnerId")
    @Mapping(source = "assignedBy.userId", target = "assignedBy")
    @Mapping(source = "section.sectionId", target = "sectionId")
    @Mapping(source = "section.sectionName", target = "sectionName")
    DepartmentLearnerDto toDto(DepartmentLearner entity);

    @Mapping(source = "departmentId", target = "department.departmentId")
    @Mapping(source = "institutionCertLearnerId", target = "institutionCertLearner.institutionCertLearnerId")
    @Mapping(source = "assignedBy", target = "assignedBy.userId")
    DepartmentLearner toEntity(DepartmentLearnerDto dto);
}
