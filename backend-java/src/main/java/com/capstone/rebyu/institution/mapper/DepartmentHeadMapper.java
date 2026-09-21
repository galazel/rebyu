package com.capstone.rebyu.institution.mapper;

import com.capstone.rebyu.institution.dto.DepartmentHeadDto;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepartmentHeadMapper {
    @Mapping(source = "institution.institutionId", target = "institutionId")
    @Mapping(source = "user.userId", target = "userId")
    @Mapping(source = "user.email", target = "email")
    DepartmentHeadDto toDto(DepartmentHead entity);

    @Mapping(source = "institutionId", target = "institution.institutionId")
    @Mapping(source = "userId", target = "user.userId")
    DepartmentHead toEntity(DepartmentHeadDto dto);
}
