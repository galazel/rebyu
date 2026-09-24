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
    /*
     * `isPassed` has to be named on purpose, and leaving it out was silent.
     *
     * The entity declares `private boolean isPassed`, so Lombok generates the
     * accessor `isPassed()`, which JavaBeans reads as the property "passed".
     * The DTO declares `private Boolean isPassed` -- a wrapper -- so Lombok
     * generates `getIsPassed()`, which reads as the property "isPassed". The
     * two names do not match, MapStruct found no source for the target, and
     * emitted an unmapped-target WARNING rather than failing the build. The
     * generated `toDto` simply never assigned the field.
     *
     * Every exam result served by the learner portal therefore carried
     * `isPassed: null` -- whatever the database said. Nothing crashed: the
     * curriculum read those rows, found no passed sitting, and locked the road
     * behind quizzes the learner had in fact passed. `toEntity` was unaffected,
     * which is why results were written correctly and only ever read wrongly.
     */
    @Mapping(source = "passed", target = "isPassed")
    ExamResultDto toDto(ExamResult entity);

    @Mapping(source = "learnerId", target = "id.learnerId")
    @Mapping(source = "examId", target = "id.examId")
    @Mapping(source = "attemptNo", target = "id.attemptNo")
    ExamResult toEntity(ExamResultDto dto);
}
