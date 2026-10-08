package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto;
import com.capstone.rebyu.diagram.dto.DiagramGradingResultDto;
import com.capstone.rebyu.execution.dto.CodeExecutionResultDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.function.Supplier;

@Slf4j
@Service
public class AttemptGradingBatchService {

    private final int aiConcurrency;
    private final int codeConcurrency;
    private final int diagramConcurrency;

    public AttemptGradingBatchService(
            @Value("${rebyu.grading.concurrency.ai:8}") int aiConcurrency,
            @Value("${rebyu.grading.concurrency.code:4}") int codeConcurrency,
            @Value("${rebyu.grading.concurrency.diagram:4}") int diagramConcurrency) {
        this.aiConcurrency = Math.max(1, aiConcurrency);
        this.codeConcurrency = Math.max(1, codeConcurrency);
        this.diagramConcurrency = Math.max(1, diagramConcurrency);
    }

    public static final class Workload {

        private final Map<Long, Supplier<Optional<AnswerGradingResultDto>>> ai =
                new LinkedHashMap<>();
        private final Map<Long, Supplier<Optional<CodeExecutionResultDto>>> code =
                new LinkedHashMap<>();
        private final Map<Long, Supplier<Optional<DiagramGradingResultDto>>> diagram =
                new LinkedHashMap<>();

        public void ai(Long attemptQuestionId, Supplier<Optional<AnswerGradingResultDto>> task) {
            ai.put(attemptQuestionId, task);
        }

        public void code(Long attemptQuestionId, Supplier<Optional<CodeExecutionResultDto>> task) {
            code.put(attemptQuestionId, task);
        }

        public void diagram(
                Long attemptQuestionId, Supplier<Optional<DiagramGradingResultDto>> task) {
            diagram.put(attemptQuestionId, task);
        }

        public int size() {
            return ai.size() + code.size() + diagram.size();
        }

        public boolean isEmpty() {
            return size() == 0;
        }
    }

    public GradingBatch run(Workload workload) {
        if (workload.isEmpty()) {
            return GradingBatch.empty();
        }

        long startedAt = System.nanoTime();

        try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {

            Map<Long, CompletableFuture<Optional<AnswerGradingResultDto>>> aiFutures =
                    submit("ai", workload.ai, pool, new Semaphore(aiConcurrency));
            Map<Long, CompletableFuture<Optional<CodeExecutionResultDto>>> codeFutures =
                    submit("code", workload.code, pool, new Semaphore(codeConcurrency));
            Map<Long, CompletableFuture<Optional<DiagramGradingResultDto>>> diagramFutures =
                    submit("diagram", workload.diagram, pool, new Semaphore(diagramConcurrency));

            GradingBatch batch = new GradingBatch(
                    collect("ai", aiFutures),
                    collect("code", codeFutures),
                    collect("diagram", diagramFutures));

            log.info("Graded {} item(s) in {} ms (ai {}/{}, code {}/{}, diagram {}/{})",
                    workload.size(), (System.nanoTime() - startedAt) / 1_000_000,
                    batch.aiResults().size(), workload.ai.size(),
                    batch.codeResults().size(), workload.code.size(),
                    batch.diagramResults().size(), workload.diagram.size());
            return batch;
        }
    }

    private <T> Map<Long, CompletableFuture<Optional<T>>> submit(
            String family,
            Map<Long, Supplier<Optional<T>>> tasks,
            ExecutorService pool,
            Semaphore permits) {

        Map<Long, CompletableFuture<Optional<T>>> futures = new LinkedHashMap<>();
        for (Map.Entry<Long, Supplier<Optional<T>>> entry : tasks.entrySet()) {
            Long key = entry.getKey();
            Supplier<Optional<T>> task = entry.getValue();
            futures.put(key, CompletableFuture.supplyAsync(() -> {
                try {
                    permits.acquire();
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return Optional.<T>empty();
                }
                try {
                    return task.get();
                } catch (RuntimeException ex) {
                    log.warn("Grading call failed [{}] for attemptQuestion {}: {}",
                            family, key, ex.toString());
                    return Optional.<T>empty();
                } finally {
                    permits.release();
                }
            }, pool));
        }
        return futures;
    }

    private <T> Map<Long, T> collect(
            String family, Map<Long, CompletableFuture<Optional<T>>> futures) {

        Map<Long, T> results = new LinkedHashMap<>();
        for (Map.Entry<Long, CompletableFuture<Optional<T>>> entry : futures.entrySet()) {
            try {
                entry.getValue().join().ifPresent(value -> results.put(entry.getKey(), value));
            } catch (RuntimeException ex) {
                log.warn("Grading call failed [{}] for attemptQuestion {}: {}",
                        family, entry.getKey(), ex.toString());
            }
        }
        return results;
    }
}
