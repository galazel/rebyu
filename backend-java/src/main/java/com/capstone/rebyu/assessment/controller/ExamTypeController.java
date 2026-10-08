package com.capstone.rebyu.assessment.controller;


import com.capstone.rebyu.assessment.entity.Exam;
import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.assessment.dto.ExamTypeDto;
import com.capstone.rebyu.assessment.service.ExamTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-types")
@RequiredArgsConstructor
public class ExamTypeController {
    private final ExamTypeService examTypeService;
    private final RoleGuard guard;

    @GetMapping
    public List<ExamTypeDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAuthenticated(jwt);
        return examTypeService.getAll();
    }

    @GetMapping("/{id}")
    public ExamTypeDto getById(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        guard.requireAuthenticated(jwt);
        return examTypeService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamTypeDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ExamTypeDto dto) {
        guard.requireAdmin(jwt);
        return examTypeService.create(dto);
    }

    @PutMapping("/{id}")
    public ExamTypeDto update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                              @Valid @RequestBody ExamTypeDto dto) {
        guard.requireAdmin(jwt);
        return examTypeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        guard.requireAdmin(jwt);
        examTypeService.delete(id);
    }
}
