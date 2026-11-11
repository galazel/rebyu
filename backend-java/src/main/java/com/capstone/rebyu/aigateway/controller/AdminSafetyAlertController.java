package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.service.TutorSafetyAlertService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** AI tutor safety alerts across every learner, for admins (department heads see their own learners'). */
@RestController
@RequestMapping("/api/admin/safety-alerts")
@RequiredArgsConstructor
public class AdminSafetyAlertController {

    private final TutorSafetyAlertService safetyAlerts;
    private final CognitoAuthService auth;

    @GetMapping
    public List<TutorSafetyAlertService.AdminAlertRow> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "false") boolean openOnly) {
        requireAdmin(jwt);
        return safetyAlerts.listForAdmin(openOnly);
    }

    @PostMapping("/{alertId}/review")
    public void review(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long alertId,
            @RequestBody(required = false) Map<String, String> body) {
        CurrentUserDto admin = requireAdmin(jwt);
        safetyAlerts.review(alertId, admin.userId(), body == null ? null : body.get("note"));
    }

    private CurrentUserDto requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Admin access is required");
        }
        return user;
    }
}
