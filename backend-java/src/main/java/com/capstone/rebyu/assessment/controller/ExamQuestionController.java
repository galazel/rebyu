package com.capstone.rebyu.assessment.controller;


import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.assessment.dto.ExamQuestionDto;
import com.capstone.rebyu.assessment.service.ExamQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-questions")
@RequiredArgsConstructor
public class ExamQuestionController {
    private final ExamQuestionService examQuestionService;
    private final RoleGuard guard;

    @ModelAttribute
    void requireStaff(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdminOrInstitution(jwt);
    }

    @GetMapping
    public List<ExamQuestionDto> getAll() {
        return examQuestionService.getAll();
    }

    @GetMapping("/{id}")
    public ExamQuestionDto getById(@PathVariable Long id) {
        return examQuestionService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamQuestionDto create(@Valid @RequestBody ExamQuestionDto dto) {
        return examQuestionService.create(dto);
    }

    @PutMapping("/{id}")
    public ExamQuestionDto update(@PathVariable Long id, @Valid @RequestBody ExamQuestionDto dto) {
        return examQuestionService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        examQuestionService.delete(id);
    }
}
