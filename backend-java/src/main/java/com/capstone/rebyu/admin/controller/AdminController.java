package com.capstone.rebyu.admin.controller;

import com.capstone.rebyu.admin.service.AdminMetricsService;
import com.capstone.rebyu.admin.service.AdminPaymentsService;
import com.capstone.rebyu.auth.security.RoleGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * The platform administrator's dashboard figures.
 *
 * <p>ADMIN ONLY, AND CHECKED IN CODE. This class used to carry
 * {@code @PreAuthorize("hasRole('ADMIN')")} and nothing else, which protected
 * nothing: method security is not enabled in this application, so the
 * annotation never ran, and the bare {@code /api/admin} prefix was not among
 * the paths listed in the security configuration either. Both endpoints
 * answered 200 to unauthenticated callers -- including {@link #payments()},
 * which returns every paying learner's name, email address and payment
 * reference. The role is therefore resolved from the caller's token and
 * checked here, and {@code /api/admin/**} is now required to be authenticated.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
  @Autowired private AdminMetricsService metricsService;
  @Autowired private AdminPaymentsService paymentsService;
  @Autowired private RoleGuard guard;

  /**
   * Every counter on the admin dashboard, in one payload.
   *
   * The page used to assemble these in the browser by fetching /learners,
   * /institutions, /certifications, /partnership-requests,
   * /learner-certifications and /exam-results in full and calling .length on
   * each. That ships the whole platform to one laptop to produce six numbers,
   * and it has no ceiling. These are COUNT/SUM queries.
   */
  @GetMapping("/metrics")
  public ResponseEntity<AdminMetricsService.PlatformMetrics> metrics(
      @AuthenticationPrincipal Jwt jwt) {
    guard.requireAdmin(jwt);
    return ResponseEntity.ok(metricsService.platformMetrics());
  }

  /**
   * Every learner who has paid: completed certification orders and paid Pro
   * subscriptions, newest first. The dashboard tile shows the last eight; this
   * is the whole ledger behind the Payments page.
   */
  @GetMapping("/payments")
  public ResponseEntity<AdminPaymentsService.PaymentsLedger> payments(
      @AuthenticationPrincipal Jwt jwt) {
    guard.requireAdmin(jwt);
    return ResponseEntity.ok(paymentsService.ledger());
  }
}
