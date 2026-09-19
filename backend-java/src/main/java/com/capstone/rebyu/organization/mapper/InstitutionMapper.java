package com.capstone.rebyu.institution.mapper;

import com.capstone.rebyu.institution.dto.InstitutionDto;
import com.capstone.rebyu.institution.entity.Institution;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface InstitutionMapper {
    InstitutionDto toDto(Institution entity);

    Institution toEntity(InstitutionDto dto);
}
