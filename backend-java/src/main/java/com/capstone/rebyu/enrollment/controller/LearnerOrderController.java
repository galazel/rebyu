package com.capstone.rebyu.enrollment.controller;

import com.capstone.rebyu.enrollment.dto.LearnerOrderDto;
import com.capstone.rebyu.enrollment.service.LearnerOrderService;
import jakarta.validation.Valid;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learner-orders")
@RequiredArgsConstructor
public class LearnerOrderController {
    private final LearnerOrderService learnerOrderService;
    private final RoleGuard guard;

    @ModelAttribute
    void requireAdmin(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
    }

    @GetMapping
    public List<LearnerOrderDto> getAll() {
        return learnerOrderService.getAll();
    }

    @GetMapping("/{id}")
    public LearnerOrderDto getById(@PathVariable Long id) {
        return learnerOrderService.getById(id);
    }

    @GetMapping("/by-learner/{learnerId}")
    public List<LearnerOrderDto> getByLearnerId(@PathVariable Long learnerId) {
        return learnerOrderService.getByLearnerId(learnerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LearnerOrderDto create(@Valid @RequestBody LearnerOrderDto dto) {
        return learnerOrderService.create(dto);
    }

    @PutMapping("/{id}")
    public LearnerOrderDto update(@PathVariable Long id, @Valid @RequestBody LearnerOrderDto dto) {
        return learnerOrderService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        learnerOrderService.delete(id);
    }
}
