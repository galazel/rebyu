package com.capstone.rebyu.user.mapper;

import com.capstone.rebyu.user.dto.LearnerDto;
import com.capstone.rebyu.user.entity.Learner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LearnerMapper {
    @Mapping(source = "user.userId", target = "userId")
    LearnerDto toDto(Learner learner);

    /**
     * The picture is set by uploading one, never by sending its key, so an
     * incoming DTO cannot point a learner's avatar at an arbitrary object.
     * Callers that rebuild an entity from a DTO must carry the stored key over
     * themselves -- see {@code LearnerService.update}.
     */
    @Mapping(source = "userId", target = "user.userId")
    @Mapping(target = "avatarKey", ignore = true)
    Learner toEntity(LearnerDto dto);
}