package com.capstone.rebyu.assessment.mapper;

import com.capstone.rebyu.assessment.dto.ProgrammingQuestionConfigDto;
import com.capstone.rebyu.assessment.entity.ProgrammingQuestionConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProgrammingQuestionConfigMapper {

    @Mapping(source = "question.questionId", target = "questionId")
    ProgrammingQuestionConfigDto toDto(ProgrammingQuestionConfig entity);

    @Mapping(source = "questionId", target = "question.questionId")
    ProgrammingQuestionConfig toEntity(ProgrammingQuestionConfigDto dto);
}
