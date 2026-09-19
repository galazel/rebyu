package com.capstone.rebyu.enrollment.mapper;

import com.capstone.rebyu.enrollment.dto.OrganizationCertificationLearnerDto;
import com.capstone.rebyu.enrollment.entity.OrganizationCertificationLearner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrganizationCertificationLearnerMapper {
    @Mapping(source = "orgCert.orgCertId", target = "orgCertId")
    @Mapping(source = "learner.learnerId", target = "learnerId")
    OrganizationCertificationLearnerDto toDto(OrganizationCertificationLearner entity);

    @Mapping(source = "orgCertId", target = "orgCert.orgCertId")
    @Mapping(source = "learnerId", target = "learner.learnerId")
    OrganizationCertificationLearner toEntity(OrganizationCertificationLearnerDto dto);
}
