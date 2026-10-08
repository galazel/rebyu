package com.capstone.rebyu.aigateway.client;

import com.capstone.rebyu.aigateway.dto.AnswerGradingRequestDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto;
import com.capstone.rebyu.aigateway.dto.AppendConversationRequest;
import com.capstone.rebyu.aigateway.dto.ChatRequest;
import com.capstone.rebyu.aigateway.dto.ChatResponse;
import com.capstone.rebyu.aigateway.dto.ConversationResponseDto;
import com.capstone.rebyu.aigateway.dto.LessonGenerationDraftResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class AiServiceClient {

    private final WebClient webClient;

    public AiServiceClient(@Qualifier("aiWebClient") WebClient aiWebClient) {
        this.webClient = aiWebClient;
    }

    public ChatResponse chat(ChatRequest request) {
        try {
            return webClient.post()
                    .uri("/tutor/chat")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ChatResponse.class)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException("Tutor chat request failed", e);
        }
    }

    public Flux<ServerSentEvent<String>> streamChat(ChatRequest request) {
        return webClient.post()
                .uri("/tutor/chat/stream")
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(request)
                .httpRequest(httpRequest -> {
                    reactor.netty.http.client.HttpClientRequest nettyRequest = httpRequest.getNativeRequest();
                    nettyRequest.responseTimeout(Duration.ofMinutes(3));
                })
                .retrieve()
                .bodyToFlux(SSE);
    }

    private static final ParameterizedTypeReference<ServerSentEvent<String>> SSE =
            new ParameterizedTypeReference<>() {};

    public ConversationResponseDto getConversation(String sessionId) {
        try {
            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tutor/conversation")
                            .queryParam("sessionId", sessionId)
                            .build())
                    .retrieve()
                    .bodyToMono(ConversationResponseDto.class)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException("Tutor conversation request failed", e);
        }
    }

    public ConversationResponseDto appendConversation(AppendConversationRequest request) {
        try {
            return webClient.post()
                    .uri("/tutor/conversation/messages")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ConversationResponseDto.class)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException("Recording the tutor conversation turn failed", e);
        }
    }

    public LessonGenerationDraftResponseDto generateLessonDraft(
            Long lessonId, List<MultipartFile> files, String additionalInstructions) {
        try {
            MultipartBodyBuilder parts = new MultipartBodyBuilder();
            parts.part("lessonId", lessonId);
            if (additionalInstructions != null) {
                parts.part("additionalInstructions", additionalInstructions);
            }
            attachFiles(parts, files);

            return webClient.post()
                    .uri("/lessons/generate")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(parts.build()))
                    .retrieve()
                    .bodyToMono(LessonGenerationDraftResponseDto.class)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException("Lesson draft generation request failed", e);
        }
    }

    private static final Duration GRADING_TIMEOUT = Duration.ofSeconds(60);

    public Optional<AnswerGradingResultDto> gradeAnswer(AnswerGradingRequestDto request) {
        try {
            AnswerGradingResultDto result = webClient.post()
                    .uri("/assessments/grade-answer")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AnswerGradingResultDto.class)
                    .block(GRADING_TIMEOUT);
            return Optional.ofNullable(result);
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                log.error("Answer grading rejected with {} -- not retrying. "
                                + "Check that POST /assessments/grade-answer exists on the AI service.",
                        e.getStatusCode(), e);
                throw new AiServiceException(
                        "Answer grading endpoint returned " + e.getStatusCode(), e);
            }
            log.warn("Answer grading failed with {} -- retryable", e.getStatusCode(), e);
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Answer grading request failed [{}]: {}",
                    e.getClass().getSimpleName(), e.getMessage(), e);
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateStudyAid(String type, String lessonName, Long lessonId) {
        try {
            Map<String, Object> body = Map.of(
                    "type", type,
                    "lessonName", lessonName == null ? "" : lessonName,
                    "lessonId", lessonId
            );
            return webClient.post()
                    .uri("/study-aids/generate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            throw new AiServiceException("Study aid generation request failed", e);
        }
    }

    private void attachFiles(MultipartBodyBuilder parts, List<MultipartFile> files) throws IOException {
        if (files == null) {
            return;
        }
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            parts.part("files", new ByteArrayResource(file.getBytes()) {
                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    })
                    .contentType(MediaType.parseMediaType(
                            file.getContentType() != null ? file.getContentType() : "application/octet-stream"));
        }
    }
}
