package com.capstone.rebyu.institutiongroup.mapper;

import com.capstone.rebyu.institutiongroup.dto.InstitutionGroupDto;
import com.capstone.rebyu.institutiongroup.entity.InstitutionGroup;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InstitutionGroupMapper {
    @Mapping(source = "institution.institutionId", target = "institutionId")
    @Mapping(source = "institutionCert.institutionCertId", target = "institutionCertId")
    @Mapping(source = "institutionCert.certification.certificationId", target = "certificationId")
    @Mapping(source = "createdBy.userId", target = "createdBy")
    InstitutionGroupDto toDto(InstitutionGroup entity);

    @Mapping(source = "institutionId", target = "institution.institutionId")
    @Mapping(source = "institutionCertId", target = "institutionCert.institutionCertId")
    @Mapping(target = "institutionCert.certification", ignore = true)
    @Mapping(source = "createdBy", target = "createdBy.userId")
    InstitutionGroup toEntity(InstitutionGroupDto dto);
}
