package com.capstone.rebyu.assessment.mapper;

import com.capstone.rebyu.assessment.dto.ProgrammingQuestionConfigDto;
import com.capstone.rebyu.assessment.dto.ProgrammingTestCaseDto;
import com.capstone.rebyu.assessment.entity.ProgrammingQuestionConfig;
import com.capstone.rebyu.assessment.entity.ProgrammingTestCase;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring", uses = {ProgrammingTestCaseMapper.class})
public abstract class ProgrammingQuestionConfigMapper {

    @Autowired
    protected ProgrammingTestCaseMapper programmingTestCaseMapper;

    @Mapping(source = "question.questionId", target = "questionId")
    public abstract ProgrammingQuestionConfigDto toDto(ProgrammingQuestionConfig entity);

    @Mapping(source = "questionId", target = "question.questionId")
    @Mapping(target = "testCases", ignore = true)
    public abstract ProgrammingQuestionConfig toEntity(ProgrammingQuestionConfigDto dto);

    @AfterMapping
    protected void afterToEntity(ProgrammingQuestionConfigDto dto, @MappingTarget ProgrammingQuestionConfig entity) {
        List<ProgrammingTestCase> testCases = new ArrayList<>();
        if (dto.getTestCases() != null) {
            for (int i = 0; i < dto.getTestCases().size(); i++) {
                ProgrammingTestCaseDto tcDto = dto.getTestCases().get(i);
                ProgrammingTestCase tc = programmingTestCaseMapper.toEntity(tcDto);
                tc.setProgrammingTestCaseId(null);
                tc.setProgrammingQuestionConfig(entity);
                if (i == 0) {
                    tc.setSample(true);
                }
                testCases.add(tc);
            }
        }
        entity.setTestCases(testCases);
    }
}
