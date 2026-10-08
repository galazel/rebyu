package com.capstone.rebyu.enrollment.controller;

import com.capstone.rebyu.enrollment.dto.LearnerOrderDetailDto;
import com.capstone.rebyu.enrollment.service.LearnerOrderDetailService;
import jakarta.validation.Valid;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learner-order-details")
@RequiredArgsConstructor
public class LearnerOrderDetailController {
    private final LearnerOrderDetailService learnerOrderDetailService;
    private final RoleGuard guard;

    @ModelAttribute
    void requireAdmin(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
    }

    @GetMapping
    public List<LearnerOrderDetailDto> getAll() {
        return learnerOrderDetailService.getAll();
    }

    @GetMapping("/{id}")
    public LearnerOrderDetailDto getById(@PathVariable Long id) {
        return learnerOrderDetailService.getById(id);
    }

    @GetMapping("/by-order/{orderId}")
    public List<LearnerOrderDetailDto> getByOrderId(@PathVariable Long orderId) {
        return learnerOrderDetailService.getByOrderId(orderId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LearnerOrderDetailDto create(@Valid @RequestBody LearnerOrderDetailDto dto) {
        return learnerOrderDetailService.create(dto);
    }

    @PutMapping("/{id}")
    public LearnerOrderDetailDto update(@PathVariable Long id, @Valid @RequestBody LearnerOrderDetailDto dto) {
        return learnerOrderDetailService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        learnerOrderDetailService.delete(id);
    }
}
