package com.capstone.rebyu.assessment.config;

import com.capstone.rebyu.assessment.entity.ExamType;
import com.capstone.rebyu.assessment.repository.ExamTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamTypeSeeder implements ApplicationRunner {

    private static final List<String> REQUIRED_TYPES = List.of(
            "DIAGNOSTIC",
            "MOCK_EXAM",
            "MAJOR_EXAM",
            "MIDDLE_EXAM",
            "LESSON_QUIZ",
            "GENERATED_QUIZ",
            "GENERATED_FLASHCARD",
            "RECALL",
            "CHALLENGE",
            "KNOWLEDGE_CHECK");

    private final ExamTypeRepository examTypeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Set<String> existing = examTypeRepository.findAll().stream()
                .map(ExamType::getExamTypeText)
                .collect(Collectors.toCollection(HashSet::new));

        List<ExamType> missing = REQUIRED_TYPES.stream()
                .filter(type -> !existing.contains(type))
                .map(type -> ExamType.builder().examTypeText(type).build())
                .toList();

        if (missing.isEmpty()) {
            return;
        }

        examTypeRepository.saveAll(missing);
        log.info("Seeded {} missing exam type(s): {}", missing.size(),
                missing.stream().map(ExamType::getExamTypeText).toList());
    }
}
