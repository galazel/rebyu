package com.capstone.rebyu.admin.controller;

import com.capstone.rebyu.admin.service.AdminMetricsService;
import com.capstone.rebyu.admin.service.AdminPaymentsService;
import com.capstone.rebyu.auth.security.RoleGuard;
import com.capstone.rebyu.notification.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  @Autowired private AdminMetricsService metricsService;
  @Autowired private AdminPaymentsService paymentsService;
  @Autowired private RoleGuard guard;
  @Autowired private EmailService emailService;

  @GetMapping("/metrics")
  public ResponseEntity<AdminMetricsService.PlatformMetrics> metrics(
      @AuthenticationPrincipal Jwt jwt) {
    guard.requireAdmin(jwt);
    return ResponseEntity.ok(metricsService.platformMetrics());
  }

  @GetMapping("/payments")
  public ResponseEntity<AdminPaymentsService.PaymentsLedger> payments(
      @AuthenticationPrincipal Jwt jwt) {
    guard.requireAdmin(jwt);
    return ResponseEntity.ok(paymentsService.ledger());
  }

  @PostMapping("/test-badge-email")
  public ResponseEntity<String> testBadgeEmail(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam String to) {
    guard.requireAdmin(jwt);
    emailService.sendBadgeEarned(
        to,
        "Test Learner",
        "IT Passport Exam",
        "78%",
        false,
        4L,
        "REBYU-CERT-2026-SAMPLE",
        java.time.LocalDateTime.now()
    );
    return ResponseEntity.ok("Sample badge email sent to " + to);
  }
}
