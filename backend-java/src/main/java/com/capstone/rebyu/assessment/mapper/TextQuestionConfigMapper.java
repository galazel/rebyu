package com.capstone.rebyu.assessment.mapper;

import com.capstone.rebyu.assessment.dto.TextQuestionConfigDto;
import com.capstone.rebyu.assessment.entity.TextQuestionConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Arrays;
import java.util.List;

@Mapper(componentModel = "spring")
public interface TextQuestionConfigMapper {
    @Mapping(source = "question.questionId", target = "questionId")
    TextQuestionConfigDto toDto(TextQuestionConfig entity);

    @Mapping(source = "questionId", target = "question.questionId")
    TextQuestionConfig toEntity(TextQuestionConfigDto dto);

    default List<String> mapVariations(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split("\\n"))
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .toList();
    }

    default String mapVariations(List<String> value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        String joined = value.stream()
                .filter(line -> line != null && !line.isBlank())
                .map(String::trim)
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");
        return joined.isEmpty() ? null : joined;
    }
}
