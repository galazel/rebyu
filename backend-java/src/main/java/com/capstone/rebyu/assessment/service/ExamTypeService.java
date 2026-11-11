package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.dto.ExamTypeDto;
import com.capstone.rebyu.assessment.mapper.ExamTypeMapper;
import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ExamTypeService {
    private final ExamTypeRepository examTypeRepository;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;
    private final ExamTypeMapper examTypeMapper;

    public List<ExamTypeDto> getAll() {
        log.debug("Fetching all exam types");
        return examTypeRepository.findAll().stream().map(examTypeMapper::toDto).toList();
    }

    public ExamTypeDto getById(Long id) {
        log.debug("Fetching exam type id: {}", id);
        return examTypeMapper.toDto(findEntity(id));
    }

    public ExamTypeDto create(ExamTypeDto dto) {
        log.info("Creating new exam type");
        ExamType entity = examTypeMapper.toEntity(dto);
        entity.setExamTypeId(null);
        ExamTypeDto result = examTypeMapper.toDto(examTypeRepository.save(entity));
        log.info("ExamType created with id: {}", result.getExamTypeId());
        return result;
    }

    public ExamTypeDto update(Long id, ExamTypeDto dto) {
        log.info("Updating exam type id: {}", id);
        findEntity(id);
        ExamType entity = examTypeMapper.toEntity(dto);
        entity.setExamTypeId(id);
        ExamTypeDto result = examTypeMapper.toDto(examTypeRepository.save(entity));
        log.info("ExamType id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting exam type id: {}", id);
        var type = findEntity(id);
        long used = cascade.countReferences("exam_types", id);
        if (used > 0) {
            throw new com.capstone.rebyu.common.BusinessRuleException.InUseException(
                    "This exam type is used by " + used + " exam" + (used == 1 ? "" : "s")
                    + ". Move or delete those exams first.");
        }
        examTypeRepository.delete(type);
        log.info("ExamType id: {} deleted", id);
    }

    private ExamType findEntity(Long id) {
        return examTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ExamType not found: " + id));
    }
}
