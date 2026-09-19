package com.capstone.rebyu.notification.mapper;

import com.capstone.rebyu.notification.dto.LearnerInvitationDto;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LearnerInvitationMapper {
    @Mapping(source = "institutionCert.institutionCertId", target = "institutionCertId")
    @Mapping(source = "learner.learnerId", target = "learnerId")
    LearnerInvitationDto toDto(LearnerInvitation entity);

    @Mapping(source = "institutionCertId", target = "institutionCert.institutionCertId")
    @Mapping(source = "learnerId", target = "learner.learnerId")
    LearnerInvitation toEntity(LearnerInvitationDto dto);
}
