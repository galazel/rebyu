package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.client.WorkflowClient;
import com.capstone.rebyu.aigateway.service.WorkflowStreamRelayService;
import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/workflows")
@RequiredArgsConstructor
public class WorkflowGatewayController {

    private final WorkflowClient workflowClient;
    private final WorkflowStreamRelayService relayService;
    private final RoleGuard guard;

    @ModelAttribute
    void requireAdmin(@AuthenticationPrincipal Jwt jwt) {
        guard.requireAdmin(jwt);
    }

    @GetMapping
    public Map<String, Object> listRuns(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long certificationId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return workflowClient.listRuns(status, certificationId, limit, offset);
    }

    @GetMapping("/awaiting-review")
    public Map<String, Object> awaitingReview(@RequestParam(defaultValue = "50") int limit) {
        return workflowClient.listAwaitingReview(limit);
    }

    @GetMapping("/{runId}")
    public Map<String, Object> getRun(
            @PathVariable String runId,
            @RequestParam(defaultValue = "0") long afterSeq) {
        return workflowClient.getRun(runId, afterSeq);
    }

    @GetMapping("/{runId}/versions")
    public Map<String, Object> getVersions(
            @PathVariable String runId,
            @RequestParam(required = false) String key) {
        return workflowClient.getVersions(runId, key);
    }

    @GetMapping(value = "/{runId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @PathVariable String runId,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId) {
        return relayService.relay(runId, lastEventId);
    }

    @GetMapping("/{runId}/review")
    public Map<String, Object> pendingReview(@PathVariable String runId) {
        return workflowClient.getPendingReview(runId);
    }

    @PostMapping("/{runId}/cancel")
    public Map<String, Object> cancel(@PathVariable String runId) {
        return workflowClient.cancelRun(runId);
    }

    @PostMapping("/{runId}/retry")
    public Map<String, Object> retry(@PathVariable String runId) {
        return workflowClient.retryRun(runId);
    }

    @PostMapping("/{runId}/restart")
    public Map<String, Object> restart(@PathVariable String runId) {
        return workflowClient.restartRun(runId);
    }

    @PostMapping("/certification/{threadId}/review")
    public Map<String, Object> reviewCertification(
            @PathVariable String threadId,
            @RequestBody Map<String, Object> decision) {
        return workflowClient.resumeCertification(threadId, decision);
    }

    @PostMapping("/certification/{threadId}/review-mode")
    public Map<String, Object> setCertificationReviewMode(
            @PathVariable String threadId,
            @RequestBody Map<String, Object> body) {
        return workflowClient.setCertificationReviewMode(threadId, body);
    }

    @PostMapping("/question-bank/{threadId}/review")
    public Map<String, Object> reviewQuestionBatch(
            @PathVariable String threadId,
            @RequestBody Map<String, Object> decision) {
        return workflowClient.reviewQuestionBatch(threadId, decision);
    }
}
