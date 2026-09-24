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

    /**
     * Admits only administrators and institution staff, to every handler here.
     *
     * <p>This controller had no authorization at all and was not listed in the
     * security configuration, so the question list of every exam on the
     * platform was readable, and rewritable, by anyone. Institution roles are
     * admitted because the institution assessment builder composes papers
     * through this path; learners never touch it.
     */
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
