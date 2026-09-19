package com.capstone.rebyu.admin.controller;

import com.capstone.rebyu.admin.service.AdminMetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
  @Autowired private AdminMetricsService metricsService;

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
}
