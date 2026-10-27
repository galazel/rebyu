package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.dto.ChatRequest;
import com.capstone.rebyu.aigateway.dto.ChatResponse;
import com.capstone.rebyu.billing.service.AiGenerationQuotaService;
import com.capstone.rebyu.learningtools.service.TutorLibraryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiChatServiceTest {
    private final AiServiceClient client = mock(AiServiceClient.class);
    private final AiGenerationQuotaService quota = mock(AiGenerationQuotaService.class);
    private final AiChatService service = new AiChatService(client, mock(TutorLibraryService.class), quota, new ObjectMapper());
    private final ChatRequest request = new ChatRequest();
    AiChatServiceTest() { when(quota.reserveTutor(9L, "tutor-chat")).thenReturn(7L); request.setSessionId("9-246"); }
    private ServerSentEvent<String> event(String json) { return ServerSentEvent.<String>builder(json).build(); }
    @Test void successfulNonEmptyDoneStreamCountsOnce() {
        when(client.streamChat(request)).thenReturn(Flux.just(event("{\"type\":\"delta\",\"text\":\"Hello\"}"), event("{\"type\":\"done\"}")));
        service.streamChat(request, 9L);
        verify(quota, timeout(3000)).settleTutor(9L, 7L, true);
        verify(quota, never()).settleTutor(9L, 7L, false);
    }
    @Test void providerErrorEventAfterPartialTextDoesNotCount() {
        when(client.streamChat(request)).thenReturn(Flux.just(event("{\"type\":\"delta\",\"text\":\"Partial\"}"), event("{\"type\":\"error\",\"message\":\"Provider failed\"}"), event("{\"type\":\"done\"}")));
        service.streamChat(request, 9L);
        verify(quota, timeout(3000)).settleTutor(9L, 7L, false);
        verify(quota, never()).settleTutor(9L, 7L, true);
    }
    @Test void networkFailureDoesNotCount() {
        when(client.streamChat(request)).thenReturn(Flux.error(new IllegalStateException("offline")));
        service.streamChat(request, 9L);
        verify(quota, timeout(3000)).settleTutor(9L, 7L, false);
        verify(quota, never()).settleTutor(9L, 7L, true);
    }
    @Test void emptyResponseOrMissingDoneDoesNotCount() {
        when(client.streamChat(request)).thenReturn(Flux.just(event("{\"type\":\"done\"}")));
        service.streamChat(request, 9L);
        verify(quota, timeout(3000)).settleTutor(9L, 7L, false);
    }
    @Test void truncatedStreamDoesNotCount() {
        when(client.streamChat(request)).thenReturn(Flux.just(event("{\"type\":\"delta\",\"text\":\"Partial\"}")));
        service.streamChat(request, 9L);
        verify(quota, timeout(3000)).settleTutor(9L, 7L, false);
    }
    @Test void emptySynchronousReplyIsAnErrorInsteadOfChargedSuccess() {
        when(client.chat(request)).thenReturn(new ChatResponse(" ", "9-246", null));
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.chat(request));
    }
    @Test void anActivityThatCannotBeSavedIsNotCharged() {
        when(client.streamChat(request)).thenReturn(Flux.just(
                ServerSentEvent.<String>builder("{\"type\":\"widget\",\"widget\":{\"type\":\"sorting\"}}").event("widget").build(),
                event("{\"type\":\"done\"}")));
        service.streamChat(request, 9L);
        verify(quota, timeout(3000)).settleTutor(9L, 7L, false);
        verify(quota, never()).settleTutor(9L, 7L, true);
        verify(quota, never()).recordTool(anyLong(), anyString());
    }
}
