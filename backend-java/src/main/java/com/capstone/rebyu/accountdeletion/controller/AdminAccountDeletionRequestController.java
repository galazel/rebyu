package com.capstone.rebyu.accountdeletion.controller;

import com.capstone.rebyu.accountdeletion.service.AccountDeletionRequestService;
import com.capstone.rebyu.accountdeletion.service.AccountDeletionRequestService.RequestDto;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin review of account deletion requests. */
@RestController
@RequestMapping("/api/admin/account-deletion-requests")
@RequiredArgsConstructor
public class AdminAccountDeletionRequestController {

    private final AccountDeletionRequestService service;
    private final RoleGuard roleGuard;

    @GetMapping
    public List<RequestDto> list(@AuthenticationPrincipal Jwt jwt,
                                 @RequestParam(defaultValue = "false") boolean pendingOnly) {
        roleGuard.requireAdmin(jwt);
        return service.listForAdmin(pendingOnly);
    }

    @PostMapping("/{requestId}/approve")
    public RequestDto approve(@AuthenticationPrincipal Jwt jwt, @PathVariable Long requestId,
                              @RequestBody(required = false) Map<String, String> body) {
        Long adminId = roleGuard.requireAdmin(jwt).userId();
        return service.approve(requestId, adminId, body == null ? null : body.get("note"));
    }

    @PostMapping("/{requestId}/decline")
    public RequestDto decline(@AuthenticationPrincipal Jwt jwt, @PathVariable Long requestId,
                              @RequestBody(required = false) Map<String, String> body) {
        Long adminId = roleGuard.requireAdmin(jwt).userId();
        return service.decline(requestId, adminId, body == null ? null : body.get("note"));
    }
}
