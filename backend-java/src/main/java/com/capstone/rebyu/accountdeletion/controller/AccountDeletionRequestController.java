package com.capstone.rebyu.accountdeletion.controller;

import com.capstone.rebyu.accountdeletion.service.AccountDeletionRequestService;
import com.capstone.rebyu.accountdeletion.service.AccountDeletionRequestService.RequestDto;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** The signed-in user's own deletion request. Lives under /api/auth/** so it is authenticated. */
@RestController
@RequestMapping("/api/auth/me/deletion-request")
@RequiredArgsConstructor
public class AccountDeletionRequestController {

    private final AccountDeletionRequestService service;
    private final RoleGuard roleGuard;

    @GetMapping
    public ResponseEntity<RequestDto> mine(@AuthenticationPrincipal Jwt jwt) {
        RequestDto request = service.mine(roleGuard.requireAuthenticated(jwt));
        return request == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(request);
    }

    @PostMapping
    public RequestDto submit(@AuthenticationPrincipal Jwt jwt,
                             @RequestBody(required = false) Map<String, String> body) {
        return service.submit(roleGuard.requireAuthenticated(jwt), body == null ? null : body.get("reason"));
    }

    @DeleteMapping
    public RequestDto cancel(@AuthenticationPrincipal Jwt jwt) {
        return service.cancel(roleGuard.requireAuthenticated(jwt));
    }
}
