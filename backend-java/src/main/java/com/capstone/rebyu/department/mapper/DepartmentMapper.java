package com.capstone.rebyu.department.mapper;

import com.capstone.rebyu.department.dto.DepartmentDto;
import com.capstone.rebyu.department.entity.Department;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {
    @Mapping(source = "institution.institutionId", target = "institutionId")
    @Mapping(source = "institutionCert.institutionCertId", target = "institutionCertId")
    @Mapping(source = "institutionCert.certification.certificationId", target = "certificationId")
    @Mapping(source = "createdBy.userId", target = "createdBy")
    DepartmentDto toDto(Department entity);

    @Mapping(source = "institutionId", target = "institution.institutionId")
    @Mapping(source = "institutionCertId", target = "institutionCert.institutionCertId")
    @Mapping(target = "institutionCert.certification", ignore = true)
    @Mapping(source = "createdBy", target = "createdBy.userId")
    Department toEntity(DepartmentDto dto);
}
