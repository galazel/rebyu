package com.capstone.rebyu.bkt.service;

import com.capstone.rebyu.bkt.dto.BktOutboxAdminView;
import com.capstone.rebyu.bkt.dto.BktReconciliationSummary;
import com.capstone.rebyu.bkt.entity.BktEventOutbox;
import com.capstone.rebyu.bkt.entity.BktOutboxStatus;
import com.capstone.rebyu.bkt.repository.BktEventOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class BktAdminService {

    private final BktEventOutboxRepository outboxRepository;
    private final BktOutboxService outboxService;
    private final BktReconciliationService reconciliationService;

    @Transactional(readOnly = true)
    public Map<String, Long> outboxStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        for (BktOutboxStatus status : BktOutboxStatus.values()) {
            stats.put(status.name(), outboxRepository.countByStatus(status));
        }
        return stats;
    }

    @Transactional(readOnly = true)
    public List<BktOutboxAdminView> deadLetter(int limit) {
        return outboxRepository.findDeadLetter(Math.max(1, limit)).stream()
                .map(BktOutboxAdminView::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BktOutboxAdminView> byStatus(BktOutboxStatus status, int limit) {
        return outboxRepository
                .findByStatusOrderByCreatedAtDesc(status, PageRequest.of(0, Math.max(1, limit)))
                .stream()
                .map(BktOutboxAdminView::from)
                .toList();
    }

    public int retry(Long id) {
        return outboxService.resetForRetry(List.of(id));
    }

    public int retryDeadLetter(int limit) {
        List<Long> ids = outboxRepository.findDeadLetter(Math.max(1, limit)).stream()
                .map(BktEventOutbox::getId)
                .toList();
        return outboxService.resetForRetry(ids);
    }

    public BktReconciliationSummary reconcile(int limit) {
        return reconciliationService.reconcile(limit);
    }
}
