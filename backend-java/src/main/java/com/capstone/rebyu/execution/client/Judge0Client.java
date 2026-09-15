package com.capstone.rebyu.execution.client;

import com.capstone.rebyu.execution.config.Judge0Properties;
import com.capstone.rebyu.execution.dto.Judge0SubmissionRequestDto;
import com.capstone.rebyu.execution.dto.Judge0SubmissionResultDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Typed, blocking client for the Judge0 code-execution API.
 *
 * <p>Judge0's batch endpoint does not honour {@code wait=true}: it only ever
 * answers with one token per submission. This client used to read that answer
 * as if it were the results, so every run came back with no status and no
 * output -- each test case "failed" and no program was ever really judged. It
 * now submits the batch, then polls the tokens until every submission has left
 * the queue (status 1 "In Queue" and 2 "Processing" are still running).
 *
 * <p>Batches are split to Judge0's default maximum batch size of 20.
 */
@Slf4j
@Component
public class Judge0Client {

    private static final int MAX_BATCH = 20;
    private static final long FIRST_POLL_MS = 300;
    private static final long MAX_POLL_MS = 1500;
    private static final String FIELDS = "token,stdout,stderr,compile_output,message,status,time,memory";

    private final WebClient webClient;
    private final Judge0Properties properties;

    public Judge0Client(WebClient judge0WebClient, Judge0Properties properties) {
        this.webClient = judge0WebClient;
        this.properties = properties;
    }

    public List<Judge0SubmissionResultDto> submitBatch(List<Judge0SubmissionRequestDto> submissions) {
        String correlationId = UUID.randomUUID().toString();
        List<Judge0SubmissionResultDto> all = new ArrayList<>();
        try {
            for (int start = 0; start < submissions.size(); start += MAX_BATCH) {
                List<Judge0SubmissionRequestDto> chunk =
                        submissions.subList(start, Math.min(start + MAX_BATCH, submissions.size()));
                all.addAll(poll(submit(chunk), correlationId));
            }
            return all;
        } catch (Judge0ServiceException e) {
            throw e;
        } catch (WebClientResponseException e) {
            throw new Judge0ServiceException(
                    "Judge0 rejected the submission with status " + e.getStatusCode()
                            + " (correlationId=" + correlationId + ")", e);
        } catch (Exception e) {
            throw new Judge0ServiceException(
                    "Judge0 service unavailable (correlationId=" + correlationId + ")", e);
        }
    }

    private List<String> submit(List<Judge0SubmissionRequestDto> chunk) {
        TokenDto[] tokens = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/submissions/batch")
                        .queryParam("base64_encoded", "true")
                        .build())
                .bodyValue(Map.of("submissions", chunk))
                .retrieve()
                .bodyToMono(TokenDto[].class)
                .block();
        if (tokens == null || tokens.length != chunk.size()) {
            throw new Judge0ServiceException("Judge0 returned "
                    + (tokens == null ? 0 : tokens.length) + " token(s) for " + chunk.size() + " submission(s)");
        }
        List<String> list = new ArrayList<>();
        for (TokenDto token : tokens) {
            if (token == null || token.token() == null || token.token().isBlank()) {
                // A submission Judge0 refused outright (e.g. an unknown language).
                throw new Judge0ServiceException("Judge0 did not accept every submission in the batch");
            }
            list.add(token.token());
        }
        return list;
    }

    /** Polls until every token is finished, or the time allowed for the batch runs out. */
    private List<Judge0SubmissionResultDto> poll(List<String> tokens, String correlationId)
            throws InterruptedException {
        String joined = tokens.stream().collect(Collectors.joining(","));
        long budgetMs = properties.getReadTimeoutMs()
                + (long) tokens.size() * Math.max(1, properties.getCpuTimeLimitSeconds()) * 1000L;
        long deadline = System.currentTimeMillis() + budgetMs;
        long delay = FIRST_POLL_MS;

        while (true) {
            Thread.sleep(delay);
            BatchResultDto batch = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/submissions/batch")
                            .queryParam("tokens", joined)
                            .queryParam("base64_encoded", "true")
                            .queryParam("fields", FIELDS)
                            .build())
                    .retrieve()
                    .bodyToMono(BatchResultDto.class)
                    .block();

            List<Judge0SubmissionResultDto> results =
                    batch == null || batch.submissions() == null ? List.of() : batch.submissions();
            boolean complete = results.size() == tokens.size()
                    && results.stream().allMatch(Judge0Client::finished);
            if (complete) {
                return results;
            }
            if (System.currentTimeMillis() + delay > deadline) {
                throw new Judge0ServiceException("Judge0 did not finish " + tokens.size()
                        + " submission(s) within " + budgetMs + "ms (correlationId=" + correlationId + ")");
            }
            delay = Math.min(MAX_POLL_MS, delay * 2);
        }
    }

    private static boolean finished(Judge0SubmissionResultDto result) {
        return result != null && result.status() != null && result.status().id() > 2;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TokenDto(String token) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BatchResultDto(List<Judge0SubmissionResultDto> submissions) {}
}
