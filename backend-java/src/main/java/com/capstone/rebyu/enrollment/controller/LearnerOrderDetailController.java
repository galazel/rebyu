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

    /**
     * Admits only administrators, to every handler on this controller.
     *
     * <p>Generic scaffolding CRUD that had no authorization of any kind and was
     * not listed in SecurityConfig either, so it exposed the line items behind every order, on the same terms. Nothing in the
     * frontend calls it; the real flows are the tenant-scoped endpoints.
     *
     * <p>A {@code @ModelAttribute} method runs before every handler in its own
     * controller, so the gate does not have to be remembered per method.
     */
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
