package com.capstone.rebyu.billing.service;

import com.capstone.rebyu.billing.entity.AiGenerationUsage;
import com.capstone.rebyu.billing.entitlement.Entitlements;
import com.capstone.rebyu.billing.repository.AiGenerationUsageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiGenerationQuotaServiceTest {
    private final AiGenerationUsageRepository rows = mock(AiGenerationUsageRepository.class);
    private final LearnerEntitlementService entitlements = mock(LearnerEntitlementService.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final AiGenerationQuotaService service = new AiGenerationQuotaService(rows, entitlements, jdbc);
    private final Set<String> kinds = Set.of("tutor-chat", "tutor-dialogue", "tutor-live");
    AiGenerationQuotaServiceTest() {
        when(entitlements.planLimit(eq(9L), eq(Entitlements.AI_TUTOR_DAILY_MESSAGES), anyInt())).thenReturn(50);
        when(entitlements.planLimit(eq(9L), eq(Entitlements.AI_TUTOR_WEEKLY_MESSAGES), anyInt())).thenReturn(250);
    }
    private void counts(long daily, long weekly) {
        when(rows.countByLearnerIdAndKindInAndUsageDateBetween(eq(9L), eq(kinds), any(), any())).thenReturn(daily, weekly);
    }
    @Test void liveSessionsAreIncludedInBothSharedWindows() {
        counts(6, 18);
        var usage = service.usage(9L, AiGenerationQuotaService.Bucket.TUTOR);
        assertEquals(6, usage.daily().used()); assertEquals(18, usage.weekly().used());
        assertEquals(50, usage.daily().limit()); assertEquals(250, usage.weekly().limit());
        assertEquals(kinds, AiGenerationQuotaService.Bucket.TUTOR.kinds());
        assertFalse(kinds.contains("tool:quiz"));
    }
    @Test void sixthLiveSessionCanStartWhenSharedAllowanceIsAvailable() {
        counts(5, 5);
        assertEquals("signed", service.authorizeTutor(9L, "tutor-live", () -> "signed"));
        verify(rows).save(argThat(row -> row.getLearnerId().equals(9L) && row.getKind().equals("tutor-live")));
    }
    @Test void usageApiReturnsOneSharedBucket() {
        when(entitlements.getEffectiveEntitlements(9L, null)).thenReturn(new com.capstone.rebyu.billing.dto.EntitlementDtos.LearnerEntitlementsDto(
                9L, com.capstone.rebyu.billing.dto.EntitlementDtos.AccessSource.PERSONAL_PRO, true, false, Set.of(Entitlements.AI_TUTOR), "PRO_MONTHLY", "ACTIVE", null, false, false, 0, 0));
        counts(7, 19);
        var result = service.usage(9L);
        assertEquals(1, result.size()); assertEquals("tutor", result.getFirst().key());
        assertEquals(7, result.getFirst().daily().used()); assertEquals(19, result.getFirst().weekly().used());
    }
    @Test void allModesAreBlockedWhenDailySharedAllowanceIsExhausted() {
        for (String kind : kinds) {
            counts(50, 50);
            Supplier<String> provider = mock(Supplier.class);
            assertThrows(AiGenerationQuotaService.UsageLimitException.class, () -> service.authorizeTutor(9L, kind, provider));
            verifyNoInteractions(provider);
        }
        verify(rows, never()).save(any());
    }
    @Test void weeklyLimitBlocksLiveEvenWhenDailyHasRoom() {
        counts(2, 250);
        Supplier<String> provider = mock(Supplier.class);
        var error = assertThrows(AiGenerationQuotaService.UsageLimitException.class, () -> service.authorizeTutor(9L, "tutor-live", provider));
        assertTrue(error.getMessage().contains("this week"));
        verifyNoInteractions(provider); verify(rows, never()).save(any());
    }
    @Test void failedProviderDoesNotDebit() {
        counts(1, 1);
        assertThrows(IllegalStateException.class, () -> service.authorizeTutor(9L, "tutor-live", () -> { throw new IllegalStateException("offline"); }));
        verify(rows, never()).save(any());
    }
    @Test void lockAndChecksPrecedeProviderAndSingleDebit() {
        counts(0, 0);
        Supplier<String> provider = mock(Supplier.class); when(provider.get()).thenReturn("signed");
        service.authorizeTutor(9L, "tutor-live", provider);
        var order = inOrder(jdbc, rows, provider);
        order.verify(jdbc).query(anyString(), any(RowCallbackHandler.class), eq(1279874629), eq(9));
        order.verify(rows, times(2)).countByLearnerIdAndKindInAndUsageDateBetween(eq(9L), eq(kinds), any(), any());
        order.verify(provider).get(); order.verify(rows).save(any());
    }
    @Test void mixedModesConsumeTheSamePlanLimit() {
        var count = new AtomicInteger();
        when(entitlements.planLimit(eq(9L), eq(Entitlements.AI_TUTOR_DAILY_MESSAGES), anyInt())).thenReturn(3);
        when(rows.countByLearnerIdAndKindInAndUsageDateBetween(eq(9L), eq(kinds), any(), any())).thenAnswer(call -> (long) count.get());
        when(rows.save(any())).thenAnswer(call -> { count.incrementAndGet(); return call.getArgument(0); });
        for (String kind : List.of("tutor-chat", "tutor-dialogue", "tutor-live")) service.authorizeTutor(9L, kind, () -> "ok");
        assertEquals(3, count.get());
        assertThrows(AiGenerationQuotaService.UsageLimitException.class, () -> service.authorizeTutor(9L, "tutor-chat", () -> fail("over limit")));
    }
    @Test void breakdownIncludesExistingLiveRowsButNotToolRowsInTotals() {
        LocalDate today = AiGenerationQuotaService.today();
        when(rows.findByLearnerIdAndUsageDateBetween(eq(9L), any(), any())).thenReturn(List.of(
                AiGenerationUsage.builder().kind("tutor-live").usageDate(today).build(),
                AiGenerationUsage.builder().kind("tutor-chat").usageDate(today).build(),
                AiGenerationUsage.builder().kind("tool:quiz").usageDate(today).build(),
                AiGenerationUsage.builder().kind("hold-live").usageDate(today).build(),
                AiGenerationUsage.builder().kind("failed-chat").usageDate(today).build()));
        var report = service.breakdown(9L);
        assertEquals(1L, report.today().get("tutor-live"));
        assertEquals(2L, report.days().getLast().get("messages"));
        assertFalse(report.today().containsKey("hold-live")); assertFalse(report.today().containsKey("failed-chat"));
    }
    @Test void reservationsPreventParallelOverbookingButAreNotChargedUsage() {
        counts(49, 100);
        when(rows.countByLearnerIdAndKindInAndUsageDateBetweenAndCreatedAtAfter(eq(9L), any(), any(), any(), any())).thenReturn(1L);
        assertEquals(49, service.usage(9L, AiGenerationQuotaService.Bucket.TUTOR).daily().used());
        counts(49, 100);
        assertThrows(AiGenerationQuotaService.UsageLimitException.class, () -> service.reserveTutor(9L, "tutor-live"));
        verify(rows, never()).saveAndFlush(any());
    }
    @Test void successfulSettlementIsIdempotentAndFailuresCannotBeRevived() {
        var row = AiGenerationUsage.builder().aiGenerationUsageId(7L).learnerId(9L).kind("hold-chat").build();
        when(rows.findById(7L)).thenReturn(java.util.Optional.of(row));
        service.settleTutor(9L, 7L, true); service.settleTutor(9L, 7L, true);
        assertEquals("tutor-chat", row.getKind()); verify(rows, times(1)).save(row);
        row.setKind("hold-chat"); service.settleTutor(9L, 7L, false); service.settleTutor(9L, 7L, true);
        assertEquals("failed-chat", row.getKind()); verify(rows, times(2)).save(row);
    }
    @Test void anotherLearnerCannotSettleOrClaimAReservation() {
        when(rows.findById(7L)).thenReturn(java.util.Optional.of(AiGenerationUsage.builder().learnerId(9L).kind("hold-live").build()));
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.settleTutor(10L, 7L, true));
        verify(rows, never()).save(any());
    }
    @Test void reservationWritesOnlyAnUnchargedHold() {
        counts(0, 0);
        when(rows.saveAndFlush(any())).thenAnswer(call -> { AiGenerationUsage row = call.getArgument(0); row.setAiGenerationUsageId(7L); return row; });
        assertEquals(7L, service.reserveTutor(9L, "tutor-live"));
        verify(rows).saveAndFlush(argThat(row -> "hold-live".equals(row.getKind())));
        verify(rows, never()).save(any());
    }
    @Test void laterProviderFailureReversesPartialLiveDeliveryOnlyOnce() {
        var row = AiGenerationUsage.builder().learnerId(9L).kind("hold-live").providerVerified(false).build();
        when(rows.findById(7L)).thenReturn(java.util.Optional.of(row));
        service.settleLive(9L, 7L, true, false);
        assertEquals("tutor-live", row.getKind()); assertFalse(row.getProviderVerified());
        service.settleLive(9L, 7L, false, true);
        assertEquals("failed-live", row.getKind()); assertTrue(row.getProviderVerified());
        service.settleLive(9L, 7L, true, true);
        assertEquals("failed-live", row.getKind()); verify(rows, times(2)).save(row);
    }
}
