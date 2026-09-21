package com.capstone.rebyu.department.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.dto.DepartmentLearnerDto;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.service.DepartmentLearnerService;
import com.capstone.rebyu.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/department-learners")
@RequiredArgsConstructor
public class DepartmentLearnerController {

    private final DepartmentLearnerService departmentLearnerService;
    private final DepartmentService departmentService;
    private final CognitoAuthService auth;

    @GetMapping
    public List<DepartmentLearnerDto> getAll(
            @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) Long departmentId) {
        CurrentUserDto caller = requireInstitutionCaller(jwt);
        if (departmentId == null) {
            throw new IllegalArgumentException("A departmentId is required.");
        }
        departmentService.getAccessibleById(
                departmentId,
                caller.institutionId(),
                caller.userId(),
                "owner".equalsIgnoreCase(caller.departmentHeadRole()));
        return departmentLearnerService.getAll(departmentId);
    }

    @GetMapping("/{id}")
    public DepartmentLearnerDto getById(@PathVariable Long id) {
        return departmentLearnerService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentLearnerDto create(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DepartmentLearnerDto dto) {
        CurrentUserDto caller = requireInstitutionCaller(jwt);
        dto.setAssignedBy(caller.userId());
        return departmentLearnerService.create(dto, caller.institutionId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        CurrentUserDto caller = requireInstitutionCaller(jwt);
        departmentLearnerService.delete(id, caller.institutionId());
    }

    @PatchMapping("/{id}/role")
    public DepartmentLearnerDto changeRole(
            @AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody Map<String, String> body) {
        CurrentUserDto caller = requireInstitutionCaller(jwt);
        DepartmentLearner.Role newRole = DepartmentLearner.Role.valueOf(
                body.getOrDefault("role", "").toLowerCase());
        return departmentLearnerService.changeRole(id, newRole, caller.institutionId());
    }

    private CurrentUserDto requireInstitutionCaller(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        return user;
    }
}
