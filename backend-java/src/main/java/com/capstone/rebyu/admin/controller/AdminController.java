package com.capstone.rebyu.admin.controller;

import com.capstone.rebyu.admin.service.AdminMetricsService;
import com.capstone.rebyu.admin.service.AdminPaymentsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
  @Autowired private AdminMetricsService metricsService;
  @Autowired private AdminPaymentsService paymentsService;

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
  public ResponseEntity<AdminMetricsService.PlatformMetrics> metrics() {
    return ResponseEntity.ok(metricsService.platformMetrics());
  }

  /**
   * Every learner who has paid: completed certification orders and paid Pro
   * subscriptions, newest first. The dashboard tile shows the last eight; this
   * is the whole ledger behind the Payments page.
   */
  @GetMapping("/payments")
  public ResponseEntity<AdminPaymentsService.PaymentsLedger> payments() {
    return ResponseEntity.ok(paymentsService.ledger());
  }
}
