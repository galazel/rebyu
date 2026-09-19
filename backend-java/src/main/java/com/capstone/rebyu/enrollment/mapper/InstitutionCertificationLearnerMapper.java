package com.capstone.rebyu.enrollment.mapper;

import com.capstone.rebyu.enrollment.dto.InstitutionCertificationLearnerDto;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InstitutionCertificationLearnerMapper {
    @Mapping(source = "institutionCert.institutionCertId", target = "institutionCertId")
    @Mapping(source = "learner.learnerId", target = "learnerId")
    InstitutionCertificationLearnerDto toDto(InstitutionCertificationLearner entity);

    @Mapping(source = "institutionCertId", target = "institutionCert.institutionCertId")
    @Mapping(source = "learnerId", target = "learner.learnerId")
    InstitutionCertificationLearner toEntity(InstitutionCertificationLearnerDto dto);
}
