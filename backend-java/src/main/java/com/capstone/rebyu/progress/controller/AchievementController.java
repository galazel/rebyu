package com.capstone.rebyu.progress.controller;

import com.capstone.rebyu.progress.dto.AchievementDto;
import com.capstone.rebyu.progress.service.AchievementService;
import jakarta.validation.Valid;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {
    private final AchievementService achievementService;
    private final RoleGuard guard;

    /**
     * Admits only administrators, to every handler on this controller.
     *
     * <p>Generic scaffolding CRUD that had no authorization of any kind and was
     * not listed in SecurityConfig either, so it exposed the achievement catalogue, which anyone could rewrite or delete. Nothing in the
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
    public List<AchievementDto> getAll() {
        return achievementService.getAll();
    }

    @GetMapping("/{id}")
    public AchievementDto getById(@PathVariable Long id) {
        return achievementService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AchievementDto create(@Valid @RequestBody AchievementDto dto) {
        return achievementService.create(dto);
    }

    @PutMapping("/{id}")
    public AchievementDto update(@PathVariable Long id, @Valid @RequestBody AchievementDto dto) {
        return achievementService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        achievementService.delete(id);
    }
}
