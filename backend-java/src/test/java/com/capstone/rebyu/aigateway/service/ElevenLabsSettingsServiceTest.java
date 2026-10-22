package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.LiveTutorSettings;
import com.capstone.rebyu.aigateway.repository.LiveTutorSettingsRepository;
import com.capstone.rebyu.billing.repository.PlanEntitlementRepository;
import com.capstone.rebyu.billing.repository.SubscriptionPlanRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ElevenLabsSettingsServiceTest {
    private final LiveTutorSettingsRepository rows = mock(LiveTutorSettingsRepository.class);
    private final SubscriptionPlanRepository plans = mock(SubscriptionPlanRepository.class);
    private final ElevenLabsSettingsService service = new ElevenLabsSettingsService(rows, mock(JdbcTemplate.class), mock(PlanEntitlementRepository.class), plans);
    @Test void defaultsToFiveWithoutRewritingDatabase() { assertEquals(5, service.config().getDailySessionLimit()); verify(rows, never()).save(any()); }
    @Test void invalidBoundsAreRejectedBeforeProviderOrDatabaseWrites() {
        for (int cap : new int[]{0, -1, 1001}) assertThrows(ResponseStatusException.class, () -> service.update(new ElevenLabsSettingsService.Update(true, cap, 1800, "voice", null, null), "admin"));
        assertThrows(ResponseStatusException.class, () -> service.update(new ElevenLabsSettingsService.Update(true, 5, 1801, "voice", null, null), "admin"));
        assertThrows(ResponseStatusException.class, () -> service.update(new ElevenLabsSettingsService.Update(true, 5, 1800, "../bad", null, null), "admin"));
        verifyNoInteractions(rows, plans);
    }
    @Test void quotaOnlyUpdateDoesNotNeedProviderAccess() {
        var config = new LiveTutorSettings(); when(rows.findById(1L)).thenReturn(Optional.of(config)); when(rows.save(any())).thenAnswer(call -> call.getArgument(0));
        var saved = service.update(new ElevenLabsSettingsService.Update(false, 8, 1800, config.getVoiceId(), null, null), "admin@example.test");
        assertEquals(8, saved.getDailySessionLimit()); assertFalse(saved.isEnabled()); assertEquals("admin@example.test", saved.getUpdatedBy());
    }
    @Test void providerFailureDoesNotSaveVoiceOrLimit() {
        var config = new LiveTutorSettings(); when(rows.findById(1L)).thenReturn(Optional.of(config));
        assertThrows(ResponseStatusException.class, () -> service.update(new ElevenLabsSettingsService.Update(true, 9, 1800, "anotherVoice", null, null), "admin"));
        verify(rows, never()).save(any()); assertEquals(5, config.getDailySessionLimit());
    }
}
