package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.aigateway.entity.LiveTutorSettings;
import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.function.Supplier;
import java.util.Map;
import java.util.List;
import java.time.LocalDateTime;
import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LiveTutorQuotaServiceTest {
    private final ElevenLabsSettingsService settings = mock(ElevenLabsSettingsService.class);
    private final AiGenerationQuotaService quota = mock(AiGenerationQuotaService.class);
    private final LiveTutorQuotaService service = new LiveTutorQuotaService(settings, quota);
    private final LiveTutorSettings config = new LiveTutorSettings();
    LiveTutorQuotaServiceTest() { when(settings.config()).thenReturn(config); when(settings.agentId()).thenReturn("agent_test"); when(quota.reserveTutor(9L, "tutor-live")).thenReturn(7L); }

    @Test void delegatesToSharedAllowanceAndIgnoresLegacySessionCap() {
        config.setDailySessionLimit(1);
        Supplier<String> provider = () -> "wss://provider.test?conversation_id=conv_test&conversation_signature=private";
        assertEquals(7L, service.authorize(9L, provider).usageId());
        verify(quota).reserveTutor(9L, "tutor-live");
        verify(quota).bindLive(9L, 7L, "conv_test", "agent_test");
        verify(quota, never()).authorizeTutor(any(), any(), any());
    }
    @Test void sharedLimitFailurePropagatesWithoutCallingProvider() {
        Supplier<String> provider = mock(Supplier.class);
        var failure = new AiGenerationQuotaService.UsageLimitException(AiGenerationQuotaService.Bucket.TUTOR, "this week", 250, "on Monday");
        when(quota.reserveTutor(9L, "tutor-live")).thenThrow(failure);
        assertSame(failure, assertThrows(AiGenerationQuotaService.UsageLimitException.class, () -> service.authorize(9L, provider)));
        verifyNoInteractions(provider);
    }
    @Test void disabledLiveTutorDoesNotIssueOrDebit() {
        config.setEnabled(false);
        assertThrows(ResponseStatusException.class, () -> service.authorize(9L, () -> fail("provider must not be called")));
        verifyNoInteractions(quota);
    }
    @Test void administratorPreviewDoesNotUseLearnerAllowance() {
        assertEquals("signed", service.authorize(null, () -> "signed").signedUrl());
        verifyNoInteractions(quota);
    }
    @Test void exhaustedCreditsNeverReserveOrChargeAUse() {
        doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)).when(settings).requireAvailableCredits();
        Supplier<String> provider = mock(Supplier.class);
        assertThrows(ResponseStatusException.class, () -> service.authorize(9L, provider));
        verifyNoInteractions(provider, quota);
    }
    @Test void issuanceErrorReleasesReservation() {
        assertThrows(IllegalStateException.class, () -> service.authorize(9L, () -> { throw new IllegalStateException("provider failed"); }));
        verify(quota).settleTutor(9L, 7L, false);
    }
    private AiGenerationUsage pending() {
        var row = AiGenerationUsage.builder().aiGenerationUsageId(7L).learnerId(9L).kind("hold-live").providerConversationId("conv_test")
                .providerAgentId("agent_test").providerVerified(false).createdAt(LocalDateTime.now()).build();
        when(quota.reservation(9L, 7L)).thenReturn(row); return row;
    }
    private Map<String, Object> report(String status, boolean speech) {
        return Map.of("agent_id", "agent_test", "conversation_id", "conv_test", "status", status,
                "transcript", speech ? List.of(Map.of("role", "agent", "message", "Welcome to your lesson.")) : List.of());
    }
    @Test void emptyInitiatedConversationDoesNotCount() {
        pending(); when(settings.conversation("conv_test")).thenReturn(report("initiated", false));
        assertEquals(false, service.reconcile(9L, 7L).get("charged"));
        verify(quota, never()).settleLive(any(), any(), anyBoolean(), anyBoolean());
    }
    @Test void providerFailedConversationIsNotChargedEvenWithPartialSpeech() {
        var row = pending(); row.setKind("tutor-live");
        when(settings.conversation("conv_test")).thenReturn(report("failed", true));
        assertEquals(false, service.reconcile(9L, 7L).get("charged"));
        verify(quota).settleLive(9L, 7L, false, true);
    }
    @Test void successfulProviderTranscriptCountsOnce() {
        pending(); when(settings.conversation("conv_test")).thenReturn(report("done", true));
        assertEquals(true, service.reconcile(9L, 7L).get("charged"));
        verify(quota).settleLive(9L, 7L, true, true);
    }
    @Test void forgedConversationMetadataCannotAuthorizeACharge() {
        pending(); when(settings.conversation("conv_test")).thenReturn(Map.of("agent_id", "another_agent", "conversation_id", "conv_test"));
        assertThrows(IllegalStateException.class, () -> service.reconcile(9L, 7L));
        verify(quota, never()).settleLive(any(), any(), anyBoolean(), anyBoolean());
    }
}
