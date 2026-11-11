package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.common.TutorLockedException;
import com.capstone.rebyu.aigateway.client.AiServiceClient.TutorScreen;
import com.capstone.rebyu.aigateway.entity.TutorConduct;
import com.capstone.rebyu.aigateway.entity.TutorSafetyAlert;
import com.capstone.rebyu.aigateway.repository.TutorConductRepository;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/** Plain unit test -- no Spring context, so it never touches the live database. */
class TutorConductServiceTest {

    private final TutorConductRepository repository = mock(TutorConductRepository.class);
    private final AiServiceClient ai = mock(AiServiceClient.class);
    private final TransactionTemplate transactions = mock(TransactionTemplate.class);
    private final TutorSafetyAlertService safety = mock(TutorSafetyAlertService.class);
    private final TutorConductService service = new TutorConductService(repository, ai, transactions, safety);
    private final AtomicReference<TutorConduct> stored = new AtomicReference<>();
    private final CurrentUserDto learner = mock(CurrentUserDto.class);
    private final CurrentUserDto admin = mock(CurrentUserDto.class);

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        when(learner.learnerId()).thenReturn(7L);
        when(learner.role()).thenReturn("LEARNER");
        when(admin.learnerId()).thenReturn(8L);
        when(admin.role()).thenReturn("ADMIN");
        when(transactions.execute(any())).thenAnswer(call -> ((TransactionCallback<Object>) call.getArgument(0)).doInTransaction(null));
        when(repository.findForUpdate(7L)).thenAnswer(call -> Optional.ofNullable(stored.get()));
        when(repository.findById(7L)).thenAnswer(call -> Optional.ofNullable(stored.get()));
        when(repository.save(any())).thenAnswer(call -> { stored.set(call.getArgument(0)); return call.getArgument(0); });
    }

    @Test
    void warningThenFinalWarningThenSevenHourLock() {
        when(ai.screenTutorMessage(anyString())).thenReturn(new TutorScreen("violence", null));

        assertEquals("warning", service.screen(learner, "I will kill my teacher", "chat").get("level"));
        assertEquals("final", service.screen(learner, "I will kill my teacher", "chat").get("level"));
        TutorLockedException locked = assertThrows(TutorLockedException.class,
                () -> service.screen(learner, "I will kill my teacher", "chat"));

        Duration left = Duration.between(Instant.now(), locked.getLockedUntil());
        assertTrue(left.toMinutes() > 6 * 60 + 55 && left.toMinutes() <= 7 * 60);
        // Every tutor feature now refuses the learner.
        assertThrows(TutorLockedException.class, () -> service.requireAllowed(learner));
        assertEquals(true, service.status(learner).get("locked"));
    }

    @Test
    void cleanMessagesEarnNoStrike() {
        when(ai.screenTutorMessage(anyString())).thenReturn(TutorScreen.CLEAR);
        assertNull(service.screen(learner, "What is phishing?", "chat"));
        verify(repository, never()).save(any());
    }

    @Test
    void lockoutEndsAndStrikesStartOver() {
        stored.set(TutorConduct.builder().learnerId(7L).strikes(3)
                .lockedUntil(Instant.now().minusSeconds(60)).lastStrikeAt(Instant.now().minus(Duration.ofHours(8))).build());
        assertDoesNotThrow(() -> service.requireAllowed(learner));
        when(ai.screenTutorMessage(anyString())).thenReturn(new TutorScreen("unsafe", null));
        assertEquals("warning", service.screen(learner, "how to hack my classmate's facebook", "chat").get("level"));
    }

    @Test
    void aQuietWeekResetsStrikes() {
        stored.set(TutorConduct.builder().learnerId(7L).strikes(2)
                .lastStrikeAt(Instant.now().minus(Duration.ofDays(8))).build());
        when(ai.screenTutorMessage(anyString())).thenReturn(new TutorScreen("sexual", null));
        assertEquals("warning", service.screen(learner, "send nudes", "chat").get("level"));
    }

    @Test
    void adminsAreNeverScreenedOrLocked() {
        assertNull(service.screen(admin, "how to make a bomb", "chat"));
        verifyNoInteractions(ai);
    }

    @Test
    void aSelfHarmMessageRaisesAnAlertButNoStrike() {
        when(ai.screenTutorMessage(anyString())).thenReturn(new TutorScreen(null, "self_harm"));
        assertNull(service.screen(learner, "i am gonna kill myself", "dialogue"));
        verify(safety).raise(7L, TutorSafetyAlert.Kind.SELF_HARM, "dialogue", "i am gonna kill myself");
        verify(repository, never()).save(any());
    }

    @Test
    void aThreatRaisesAnAlertAndAStrike() {
        when(ai.screenTutorMessage(anyString())).thenReturn(new TutorScreen("threat", "threat"));
        assertEquals("warning", service.screen(learner, "i will stab my mother now", "chat").get("level"));
        verify(safety).raise(7L, TutorSafetyAlert.Kind.THREAT, "chat", "i will stab my mother now");
    }

    @Test
    void theAlertIsRaisedEvenWhenThatMessageLocksTheLearnerOut() {
        stored.set(TutorConduct.builder().learnerId(7L).strikes(2).lastStrikeAt(Instant.now()).build());
        when(ai.screenTutorMessage(anyString())).thenReturn(new TutorScreen("threat", "threat"));
        assertThrows(TutorLockedException.class, () -> service.screen(learner, "gonna bomb the airport", "chat"));
        verify(safety).raise(7L, TutorSafetyAlert.Kind.THREAT, "chat", "gonna bomb the airport");
    }

    @Test
    void aFailedAlertNeverBreaksTheTurn() {
        when(ai.screenTutorMessage(anyString())).thenReturn(new TutorScreen(null, "self_harm"));
        doThrow(new RuntimeException("db down")).when(safety).raise(any(), any(), any(), any());
        assertNull(service.screen(learner, "i want to die", "chat"));
    }

    @Test
    void aScreenOutageNeverLocksAnyoneOut() {
        when(ai.screenTutorMessage(anyString())).thenThrow(new RuntimeException("python down"));
        assertNull(service.screen(learner, "anything", "chat"));
    }
}
