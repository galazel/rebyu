package com.capstone.rebyu.user.controller;

import com.capstone.rebyu.user.dto.UserTypeDto;
import com.capstone.rebyu.user.service.UserTypeService;
import jakarta.validation.Valid;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-types")
@RequiredArgsConstructor
public class UserTypeController {
    private final UserTypeService userTypeService;
    private final RoleGuard guard;

    @ModelAttribute
    void requireAdmin(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
    }

    @GetMapping
    public List<UserTypeDto> getAll() {
        return userTypeService.getAll();
    }

    @GetMapping("/{id}")
    public UserTypeDto getById(@PathVariable Long id) {
        return userTypeService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserTypeDto create(@Valid @RequestBody UserTypeDto dto) {
        return userTypeService.create(dto);
    }

    @PutMapping("/{id}")
    public UserTypeDto update(@PathVariable Long id, @Valid @RequestBody UserTypeDto dto) {
        return userTypeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userTypeService.delete(id);
    }
}
