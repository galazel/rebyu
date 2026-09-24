package com.capstone.rebyu.bkt.controller;

import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.bkt.dto.BktOutboxAdminView;
import com.capstone.rebyu.bkt.dto.BktReconciliationSummary;
import com.capstone.rebyu.bkt.entity.BktOutboxStatus;
import com.capstone.rebyu.bkt.service.BktAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Admin operations for the BKT outbox and reconciliation, restricted to the ADMIN role.
 *
 * <p>The restriction is enforced by {@link RoleGuard}, not by the
 * {@code @PreAuthorize} annotations this class used to carry -- method security
 * is not enabled in this application, so those never ran. A local {@code
 * requireAdmin} did the real work, but it raised {@code IllegalArgumentException}
 * for both a missing token and a non-admin caller, which surfaces as 400 Bad
 * Request: the request was refused, but it read to the client as malformed
 * rather than unauthorized, and to a log reader as a client bug rather than an
 * access attempt. The shared guard answers 401 and 403.
 */
@RestController
@RequestMapping("/api/admin/bkt")
@RequiredArgsConstructor
public class BktAdminController {

    private final BktAdminService adminService;
    private final RoleGuard guard;

    @GetMapping("/outbox/stats")
    public Map<String, Long> outboxStats(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return adminService.outboxStats();
    }

    @GetMapping("/outbox/dead-letter")
    public List<BktOutboxAdminView> deadLetter(
            @RequestParam(defaultValue = "100") int limit, @AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return adminService.deadLetter(limit);
    }

    @GetMapping("/outbox")
    public List<BktOutboxAdminView> byStatus(
            // FAILED is a reserved, not-yet-used status (see BktOutboxStatus)
            // -- the dispatcher only ever produces PENDING/PROCESSING/
            // PROCESSED/DEAD_LETTER, so defaulting here to FAILED silently
            // returned nothing. DEAD_LETTER is the status admins actually
            // need to see by default.
            @RequestParam(defaultValue = "DEAD_LETTER") BktOutboxStatus status,
            @RequestParam(defaultValue = "100") int limit,
            @AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return adminService.byStatus(status, limit);
    }

    @PostMapping("/outbox/{id}/retry")
    public Map<String, Object> retry(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return Map.of("retried", adminService.retry(id));
    }

    @PostMapping("/outbox/dead-letter/retry")
    public Map<String, Object> retryDeadLetter(
            @RequestParam(defaultValue = "100") int limit, @AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return Map.of("retried", adminService.retryDeadLetter(limit));
    }

    @PostMapping("/reconcile")
    public BktReconciliationSummary reconcile(
            @RequestParam(defaultValue = "200") int limit, @AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
        return adminService.reconcile(limit);
    }

}
