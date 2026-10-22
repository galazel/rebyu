package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.aigateway.entity.LiveTutorSettings;
import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import com.capstone.rebyu.billing.repository.AiGenerationUsageRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.web.server.ResponseStatusException;
import java.util.Set;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LiveTutorQuotaServiceTest {
    private final AiGenerationUsageRepository rows = mock(AiGenerationUsageRepository.class);
    private final ElevenLabsSettingsService settings = mock(ElevenLabsSettingsService.class);
    private final LearnerEntitlementService entitlements = mock(LearnerEntitlementService.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final LiveTutorQuotaService service = new LiveTutorQuotaService(rows, entitlements, settings, jdbc);
    private final LiveTutorSettings config = new LiveTutorSettings();
    LiveTutorQuotaServiceTest() { when(settings.config()).thenReturn(config); }
    private void used(long count) { when(rows.countByLearnerIdAndKindInAndUsageDateBetween(eq(9L), eq(Set.of("tutor-live")), any(), any())).thenReturn(count); }

    @Test void fifthSessionSucceedsAndRecordsOnlyLiveUsage() {
        used(4); assertEquals("signed", service.authorize(9L, () -> "signed"));
        var entry = ArgumentCaptor.forClass(AiGenerationUsage.class); verify(rows).save(entry.capture());
        assertEquals(9L, entry.getValue().getLearnerId()); assertEquals("tutor-live", entry.getValue().getKind());
        assertEquals(AiGenerationQuotaService.today(), entry.getValue().getUsageDate());
    }
    @Test void sixthIsDeniedBeforeProviderCall() {
        used(5); Supplier<String> provider = mock(Supplier.class);
        var error = assertThrows(ResponseStatusException.class, () -> service.authorize(9L, provider));
        assertEquals(429, error.getStatusCode().value()); verifyNoInteractions(provider); verify(rows, never()).save(any());
    }
    @Test void providerFailureDoesNotConsumeAllowance() {
        used(1); assertThrows(IllegalStateException.class, () -> service.authorize(9L, () -> { throw new IllegalStateException(); }));
        verify(rows, never()).save(any());
    }
    @Test void lockPrecedesQuotaCheckAndProviderIssuance() {
        Supplier<String> provider = mock(Supplier.class); when(provider.get()).thenReturn("signed");
        service.authorize(9L, provider);
        var order = inOrder(jdbc, rows, provider);
        order.verify(jdbc).query(anyString(), any(RowCallbackHandler.class), eq(1279874629), eq(9));
        order.verify(rows).countByLearnerIdAndKindInAndUsageDateBetween(eq(9L), any(), any(), any());
        order.verify(provider).get(); order.verify(rows).save(any());
    }
    @Test void adminConfiguredCapTakesEffect() {
        config.setDailySessionLimit(2); used(2);
        assertThrows(ResponseStatusException.class, () -> service.authorize(9L, () -> "signed"));
        config.setDailySessionLimit(3); assertEquals("signed", service.authorize(9L, () -> "signed"));
    }
    @Test void disabledLiveTutorDoesNotIssueOrDebit() {
        config.setEnabled(false);
        assertThrows(ResponseStatusException.class, () -> service.authorize(9L, () -> fail("provider must not be called")));
        verifyNoInteractions(rows, jdbc);
    }
    @Test void usageHasDailyOnlyAllowanceAndNextMidnightReset() {
        used(3); var data = service.usage(9L);
        assertEquals("liveTutor", data.key()); assertNull(data.weekly()); assertEquals(5, data.daily().limit()); assertEquals(3, data.daily().used());
        assertEquals(AiGenerationQuotaService.today().plusDays(1).atStartOfDay(), data.daily().resetsAt());
        verify(rows).countByLearnerIdAndKindInAndUsageDateBetween(9L, Set.of("tutor-live"), AiGenerationQuotaService.today(), AiGenerationQuotaService.today());
    }
    @Test void usageDoesNotMixLearners() {
        used(5); assertEquals(0, service.usage(10L).daily().used());
    }
}
