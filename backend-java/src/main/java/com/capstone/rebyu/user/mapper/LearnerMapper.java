package com.capstone.rebyu.user.mapper;

import com.capstone.rebyu.user.dto.LearnerDto;
import com.capstone.rebyu.user.entity.Learner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LearnerMapper {
    @Mapping(source = "user.userId", target = "userId")
    LearnerDto toDto(Learner learner);

    @Mapping(source = "userId", target = "user.userId")
    @Mapping(target = "avatarKey", ignore = true)
    Learner toEntity(LearnerDto dto);
}