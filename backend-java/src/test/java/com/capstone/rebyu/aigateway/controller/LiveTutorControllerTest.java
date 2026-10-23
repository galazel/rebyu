package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import com.capstone.rebyu.aigateway.service.LiveTeachingService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.billing.service.LearnerEntitlementService;
import com.capstone.rebyu.billing.service.LiveTutorQuotaService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LiveTutorControllerTest {
    private final CognitoAuthService auth = mock(CognitoAuthService.class);
    private final LiveTeachingService teaching = mock(LiveTeachingService.class);
    private final AiServiceClient ai = mock(AiServiceClient.class);
    private final LiveTutorQuotaService quota = mock(LiveTutorQuotaService.class);
    private final LiveTutorController controller = new LiveTutorController(auth, mock(LearnerEntitlementService.class), teaching, mock(ElevenLabsSettingsService.class), quota, ai);
    private final CurrentUserDto user = new CurrentUserDto(7L, "", "LEARNER", 9L, null, null, "", "", "", "");
    private final Jwt jwt = Jwt.withTokenValue("test").header("alg", "none").subject("user").build();
    private final UUID id = UUID.randomUUID(), connection = UUID.randomUUID();
    LiveTutorControllerTest() { when(auth.syncCurrentUser(jwt, "test")).thenReturn(user); }
    @Test void rejectsUnauthenticatedGraphAccess() {
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> controller.coordinate(null, id, null)).getStatusCode().value());
        verifyNoInteractions(ai);
    }
    @Test void checksOwnershipBeforeCallingPython() {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(teaching).requireOwner(user, id);
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> controller.coordinate(jwt, id, new LiveTutorController.TurnRequest(connection, 1L, "typing", true, null))).getStatusCode().value());
        verifyNoInteractions(ai);
    }
    @Test void unsentTextIsRejectedAtGateway() {
        assertThrows(ResponseStatusException.class, () -> controller.coordinate(jwt, id, new LiveTutorController.TurnRequest(connection, 1L, "typing", true, "private draft")));
        verifyNoInteractions(ai);
    }
    @Test void graphEventsUseServerOwnerAndDoNotConsumeNewSessions() {
        var event = new LiveTutorController.TurnRequest(connection, 2L, "submit", null, "My answer");
        when(ai.liveTutorTurn(any())).thenReturn(Map.of("phase", "EVALUATING_ANSWER"));
        assertEquals("EVALUATING_ANSWER", controller.coordinate(jwt, id, event).get("phase"));
        verify(ai).liveTutorTurn(argThat(body -> body.get("ownerId").equals(7L) && body.get("sessionId").equals(id) && body.get("message").equals("My answer")));
        verifyNoInteractions(quota);
    }
    @Test void sharedLimitFailureIsNotMisreportedAsProviderFailure() {
        when(teaching.initialize(user, 246L)).thenReturn(new java.util.HashMap<>());
        var failure = new com.capstone.rebyu.billing.service.AiGenerationQuotaService.UsageLimitException(
                com.capstone.rebyu.billing.service.AiGenerationQuotaService.Bucket.TUTOR, "today", 50, "at midnight");
        when(quota.authorize(eq(9L), any())).thenThrow(failure);
        assertSame(failure, assertThrows(com.capstone.rebyu.billing.service.AiGenerationQuotaService.UsageLimitException.class,
                () -> controller.startSession(jwt, new LiveTutorController.StartSessionRequest(246L, "OR and IE"))));
    }
    @Test void invalidSequenceOrUnknownActionIsRejected() {
        assertThrows(ResponseStatusException.class, () -> controller.coordinate(jwt, id, new LiveTutorController.TurnRequest(connection, 0L, "typing", true, null)));
        assertThrows(ResponseStatusException.class, () -> controller.coordinate(jwt, id, new LiveTutorController.TurnRequest(connection, 1L, "execute_js", true, null)));
        verifyNoInteractions(ai);
    }
    @Test void usageVerificationChecksTeachingOwnerAndUsesServerLearner() {
        when(quota.reconcile(9L, 161L)).thenReturn(Map.of("charged", false));
        assertEquals(false, controller.reconcileUsage(jwt, id, 161L).get("charged"));
        var order = inOrder(teaching, quota);
        order.verify(teaching).requireOwner(user, id); order.verify(quota).reconcile(9L, 161L);
    }
    @Test void anotherTeachingOwnerCannotRequestUsageChanges() {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(teaching).requireOwner(user, id);
        assertThrows(ResponseStatusException.class, () -> controller.reconcileUsage(jwt, id, 161L));
        verifyNoInteractions(quota);
    }
}
