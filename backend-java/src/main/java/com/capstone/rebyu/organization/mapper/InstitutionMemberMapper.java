package com.capstone.rebyu.institution.mapper;

import com.capstone.rebyu.institution.dto.InstitutionMemberDto;
import com.capstone.rebyu.institution.entity.InstitutionMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InstitutionMemberMapper {
    @Mapping(source = "institution.institutionId", target = "institutionId")
    @Mapping(source = "user.userId", target = "userId")
    @Mapping(source = "user.email", target = "email")
    InstitutionMemberDto toDto(InstitutionMember entity);

    @Mapping(source = "institutionId", target = "institution.institutionId")
    @Mapping(source = "userId", target = "user.userId")
    InstitutionMember toEntity(InstitutionMemberDto dto);
}
