package com.capstone.rebyu.assessment.mapper;

import com.capstone.rebyu.assessment.dto.ExamResultDto;
import com.capstone.rebyu.assessment.entity.ExamResult;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExamResultMapper {
    @Mapping(source = "id.learnerId", target = "learnerId")
    @Mapping(source = "id.examId", target = "examId")
    @Mapping(source = "id.attemptNo", target = "attemptNo")
    @Mapping(source = "passed", target = "isPassed")
    ExamResultDto toDto(ExamResult entity);

    @Mapping(source = "learnerId", target = "id.learnerId")
    @Mapping(source = "examId", target = "id.examId")
    @Mapping(source = "attemptNo", target = "id.attemptNo")
    ExamResult toEntity(ExamResultDto dto);
}
