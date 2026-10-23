package com.capstone.rebyu.billing.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Handles tab closure/provider reporting delays without relying on browser error claims. */
@Component @RequiredArgsConstructor @Slf4j
public class LiveTutorUsageReconciler {
    private final AiGenerationQuotaService quota;
    private final LiveTutorQuotaService live;

    @Scheduled(fixedDelayString = "${live-tutor.usage-reconcile-ms:60000}", initialDelayString = "60000")
    public void reconcile() {
        for (var row : quota.pendingLiveVerifications()) {
            try { live.reconcile(row.getLearnerId(), row.getAiGenerationUsageId()); }
            catch (Exception failure) { log.debug("Live usage verification deferred for request {}", row.getAiGenerationUsageId()); }
        }
    }
}
