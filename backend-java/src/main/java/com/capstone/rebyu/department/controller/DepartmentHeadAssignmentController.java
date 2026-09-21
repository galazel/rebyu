package com.capstone.rebyu.department.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.dto.DepartmentHeadAssignmentDto;
import com.capstone.rebyu.department.service.DepartmentHeadAssignmentService;
import com.capstone.rebyu.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/department-head-assignments")
@RequiredArgsConstructor
public class DepartmentHeadAssignmentController {

    private final DepartmentHeadAssignmentService departmentHeadAssignmentService;
    private final DepartmentService departmentService;
    private final CognitoAuthService auth;

    @GetMapping
    public List<DepartmentHeadAssignmentDto> getAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long userId) {
        CurrentUserDto caller = institutionUser(jwt);
        if (departmentId == null) {
            throw new IllegalArgumentException("A departmentId is required.");
        }
        departmentService.getAccessibleById(
                departmentId, caller.institutionId(), caller.userId(), isOwner(caller));
        return departmentHeadAssignmentService.getAll(departmentId, userId);
    }

    @GetMapping("/{id}")
    public DepartmentHeadAssignmentDto getById(@PathVariable Long id) {
        return departmentHeadAssignmentService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentHeadAssignmentDto create(
            @Valid @RequestBody DepartmentHeadAssignmentDto dto,
            @AuthenticationPrincipal Jwt jwt) {
        Long callerInstitutionId = myInstitutionId(jwt);
        requireOwner(institutionUser(jwt));
        // Never trust assignedBy from the client -- always the authenticated caller.
        dto.setAssignedBy(callerUserId(jwt));
        return departmentHeadAssignmentService.create(dto, callerInstitutionId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireOwner(institutionUser(jwt));
        departmentHeadAssignmentService.delete(id, myInstitutionId(jwt));
    }

    private Long myInstitutionId(Jwt jwt) {
        return institutionUser(jwt).institutionId();
    }

    private CurrentUserDto institutionUser(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        return user;
    }

    // Records who actually performed the assignment from the authenticated caller.
    private Long callerUserId(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        return user.userId();
    }

    private boolean isOwner(CurrentUserDto user) {
        return "owner".equalsIgnoreCase(user.departmentHeadRole());
    }

    private void requireOwner(CurrentUserDto user) {
        if (!isOwner(user)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only Institution Administrators can assign group authorities.");
        }
    }
}
